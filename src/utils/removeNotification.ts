import { Namespace } from "socket.io";

import { redis } from "../app";
import { ENotificationType } from "../types/notification";

export const removeNotification = async (tableId: string, notification: ENotificationType, namespace: Namespace) => {
  await redis.srem(`notifications:${tableId}`, notification);
  namespace.to(tableId).emit("remove-notification", { notification, tableId });
};
