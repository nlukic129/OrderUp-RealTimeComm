import axios from "axios";

import { customerNamespace, notificationSender, redis, waiterNamespace } from "../app";
import { ENotificationType } from "../types/notification";
import { sendInitTableData } from "../utils/sendInitTableData";
import { removeNotification } from "../utils/removeNotification";
import { handleError } from "../utils/handleError";
import { margeItems } from "../utils/margeItems";
import { EItemStatus } from "../types/Item";
import { OrderData } from "../types/OrderData";
import { CustomSocket } from "../types/CustomSocket";
import { STATIC_SERVICE } from "../config";

// ! TODO Ukloniti vodjenje statisteke za konobare

export const handleWaiterEvents = (socket: CustomSocket): void => {
  console.log("Waiter connected");

  socket.cookies = socket.handshake.headers.cookie;

  // Connect to table
  socket.on(
    "connect-to-table",
    async (tableIds: string[], firebaseToken: string, callback: (response: { status: string; message: string }) => void) => {
      for (const tableId of tableIds) {
        try {
          socket.join(tableId);
          await sendInitTableData(socket, tableId);
          await redis.sadd(`waiters:${tableId}`, firebaseToken);
          callback({ status: "success", message: `Connected to table: ${tableId}` });
        } catch (error: any) {
          handleError(error, callback, `Failed to connect to table: ${tableId}`);
        }
      }
    }
  );

  // Clear table
  socket.on("clear-table", async (tableId: string, isPayment: boolean, callback: (response: { status: string; message: string }) => void) => {
    try {
      const keys = [
        `orders:pending:${tableId}`,
        `orders:resolved:${tableId}`,
        `payment:${tableId}`,
        `messages:${tableId}`,
        `notifications:${tableId}`,
        `customers:${tableId}`,
      ];
      await redis.del(keys);

      waiterNamespace.to(tableId).emit("clear-data", tableId);
      customerNamespace.to(tableId).emit("disconnect-customers");

      await axios.patch(`${STATIC_SERVICE}/waiter-stats/add-payment`, { table: tableId, isPayment }, { headers: { Cookie: socket.cookies } });

      callback({ status: "success", message: "Table cleared" });
    } catch (error: any) {
      handleError(error, callback, `Error clearing table: ${tableId}`);
    }
  });

  // Resolve order
  socket.on(
    "order-resolve",
    async (resolvedOrder: OrderData, isTableFree: boolean, callback: (response: { status: string; message: string }) => void) => {
      try {
        const { id } = resolvedOrder.table;
        const items = resolvedOrder.items;

        const resolvedItems = items.filter((item) => item.status !== EItemStatus.PENDING);
        const pendingItems = items.filter((item) => item.status === EItemStatus.PENDING);

        await redis.set(`orders:pending:${id}`, JSON.stringify(pendingItems));

        const redisResolvedItems = await redis.get(`orders:resolved:${id}`);
        const updatedResolvedItems = redisResolvedItems ? margeItems(JSON.parse(redisResolvedItems), resolvedItems) : resolvedItems;

        await redis.set(`orders:resolved:${id}`, JSON.stringify(updatedResolvedItems));

        waiterNamespace.to(id).emit("pending-items", { items: pendingItems, tableId: id });
        customerNamespace.to(id).emit("pending-items", pendingItems);
        customerNamespace.to(id).emit("resolved-items", updatedResolvedItems);

        const notificationConfig = {
          notificationType: ENotificationType.ORDER_APPROVAL,
          messageConfig: null,
          tokensKey: `customers:${id}`,
        };

        await notificationSender.sendNotification(notificationConfig);

        // Konobar kada povuce podatke o stolu,on ce imate podatak o tome da li je sto free i to ce da cuva u state-u na frontu
        // Prilikom svakog order-resolve on ce tu vrednost da prosledjuje

        const isFirstOrderForTable = isTableFree && updatedResolvedItems.length > 0;
        const isOrderCompleted = pendingItems.length === 0;

        if (isFirstOrderForTable || isOrderCompleted) {
          //  proseldi isFirstOrderForTable da ne bi svaki put zauzimao sto iako je on vec zauzet
          //  Proseltiti isOrderCompleted. Prilikom prvog zauzimanja stola da se ne bi upisivao ORDER za konobara ako nije resio celu porudzbinu
          await axios.patch(
            `${STATIC_SERVICE}/waiter-stats/add-order`,
            { table: id, isFirstOrderForTable, isOrderCompleted },
            { headers: { Cookie: socket.cookies } }
          );
        }

        // Kada se ovde vrati status success tada ce se na frontu zauzeti sto, a kada refreshuje stranicu prikazace se da je sto zauzet jer ce fetch iznad zauzeti sto u bazi
        callback({ status: "success", message: "Order resolved successfully" });
      } catch (error: any) {
        handleError(error, callback, `Error resolving order for table: ${resolvedOrder.table.id}`);
      }
    }
  );

  // Waiter coming
  socket.on("coming", async (tableId: string, notifyUsers: boolean, callback: (response: { status: string; message: string }) => void) => {
    try {
      await removeNotification(tableId, ENotificationType.CALL_WAITER, waiterNamespace);
      customerNamespace.to(tableId).emit("waiter-coming");

      const notificationConfig = {
        notificationType: ENotificationType.WAITER_COMING,
        messageConfig: { tableName: tableId },
        tokensKey: `customers:${tableId}`,
      };

      notifyUsers && (await notificationSender.sendNotification(notificationConfig));

      await axios.patch(`${STATIC_SERVICE}/waiter-stats/add-call`, { table: tableId }, { headers: { Cookie: socket.cookies } });

      callback({ status: "success", message: "Coming is successful" });
    } catch (error: any) {
      handleError(error, callback, `Error sending waiter coming notification to table: ${tableId}`);
    }
  });

  // Check message
  socket.on("check-message", async (tableId: string, message: string, callback: (response: { status: string; message: string }) => void) => {
    // TODO obavestiti i customere da je poruka cekirana, da bi se njima omogucilo da je posalju pomovo
    try {
      if (message === "ALL") {
        await redis.del(`messages:${tableId}`);
        await removeNotification(tableId, ENotificationType.MESSAGE, waiterNamespace);
      } else {
        await redis.srem(`messages:${tableId}`, message);

        const restMessages = await redis.smembers(`messages:${tableId}`);
        if (restMessages.length === 0) {
          await removeNotification(tableId, ENotificationType.MESSAGE, waiterNamespace);
        } else {
          waiterNamespace.to(tableId).emit("remove-message", { message, tableId });
        }
      }

      callback({ status: "success", message: "Message check successful" });
    } catch (error: any) {
      handleError(error, callback, `Error checking message for table: ${tableId}`);
    }
  });

  // Logout the waiter
  socket.on("logout", async (tables: string[], firebaseToken: string, callback: (response: { status: string; message: string }) => void) => {
    try {
      for (const table of tables) {
        await redis.srem(`waiters:${table}`, firebaseToken);
      }

      await axios.patch(`${STATIC_SERVICE}/auth/sign-out`, { headers: { Cookie: socket.cookies } });

      callback({ status: "success", message: "Logout is successful" });
    } catch (error: any) {
      handleError(error, callback, `Error logout the waiter`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Waiter disconnected");
  });
};
