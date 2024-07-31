import { orderManager } from "../app";
import { redis } from "../app";
import { ENotificationType } from "../types/notification";
import { sendInitTableData } from "../utils/sendInitTableData";
import { handleError } from "../utils/handleError";
import { notifyAndEmit } from "../utils/notifyAndEmit";
import { OrderData } from "../types/OrderData";
import { ITable } from "../types/ITable";
import { EPaymentType } from "../types/EPayment";
import { CustomSocket } from "../types/CustomSocket";

export const handleCustomerEvents = (socket: CustomSocket) => {
  console.log("Customer connected");

  socket.on("connect-to-table", async (tableId: string, firebaseToken: string, callback: (response: { status: string; message: string }) => void) => {
    try {
      socket.join(tableId);
      await redis.sadd(`customers:${tableId}`, firebaseToken);
      await sendInitTableData(socket, tableId);
      callback({ status: "success", message: `Connected to table: ${tableId}` });
    } catch (error: any) {
      handleError(error, callback, `Error connecting to table: ${tableId}`);
    }
  });

  socket.on("call-waiter", async (table: ITable, callback: (response: { status: string; message: string }) => void) => {
    try {
      const { id } = table;
      // TODO Obavestiti i ostale customere na stolu da je neko pozvao konobara da bi se njima onemogucilo da pozivaju konobara
      await notifyAndEmit(table, ENotificationType.CALL_WAITER, [], `waiters:${id}`);
      callback({ status: "success", message: "Waiter called" });
    } catch (error: any) {
      handleError(error, callback, `Error calling waiter at table: ${table.id}`);
    }
  });

  socket.on("pay", async (table: ITable, paymentType: EPaymentType, callback: (response: { status: string; message: string }) => void) => {
    try {
      // ! TODO - KADA SE OKINE POZIV ZA PLACANJE OD JEDNOG CUSTOMERA, ONEMOGUCITI NJEMU I SVIM OSTALIRMA DA ISTA RADE NA APP OSIM DA CEKAJU KONOBARA DA DONESE RACUN
      // TODO Obavestiti i ostale customere na stolu da je neko poslao poziv da plati da bi se njima onemogucilo da koriste app
      const { id } = table;
      await notifyAndEmit(table, ENotificationType.PAY, [paymentType], `waiters:${id}`);
      await redis.sadd(`payment:${id}`, paymentType);
      callback({ status: "success", message: "Payment sent" });
    } catch (error: any) {
      handleError(error, callback, `Error processing payment at table: ${table.id}`);
    }
  });

  socket.on("message", async (table: ITable, message: string, callback: (response: { status: string; message: string }) => void) => {
    try {
      const { id } = table;
      // TODO Obavestiti i ostale customere na stolu da je neko poslao neku poruku da bi se njima onemogucilo da posalju tu poruku
      await notifyAndEmit(table, ENotificationType.MESSAGE, [message], `waiters:${id}`);
      await redis.sadd(`messages:${id}`, message);
      callback({ status: "success", message: "Message sent" });
    } catch (error: any) {
      handleError(error, callback, `Error sending message to table: ${table.id}`);
    }
  });

  socket.on("order", async (order: OrderData) => {
    orderManager.add(order);
  });

  socket.on("disconnect", () => {
    console.log("Customer disconnected");
  });
};
