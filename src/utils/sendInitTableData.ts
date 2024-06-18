import { Socket } from "socket.io";

import { redis } from "../app";
import { Item } from "../types/Item";

export const sendInitTableData = async (socket: Socket, tableId: string) => {
  let redisPendingItems = await redis.get(`orders:pending:${tableId}`);
  const redisNotifications = await redis.smembers(`notifications:${tableId}`);
  const redisPaymentType = await redis.smembers(`payment:${tableId}`);
  const redisMessages = await redis.smembers(`messages:${tableId}`);
  const redisResolvedItems = await redis.get(`orders:resolved:${tableId}`);

  let pendingItems: Item[] = [];
  if (redisPendingItems) {
    pendingItems = JSON.parse(redisPendingItems) || [];
  }

  let resolvedItems: Item[] = [];
  if (redisResolvedItems) {
    resolvedItems = JSON.parse(redisResolvedItems) || [];
  }

  socket.emit("init-table-data", {
    pendingItems,
    resolvedItems,
    notifications: redisNotifications,
    paymentType: redisPaymentType,
    messages: redisMessages,
    tableId,
  });
};
