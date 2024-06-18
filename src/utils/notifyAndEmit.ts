import { notificationSender, redis, waiterNamespace } from "../app";
import { ENotificationType } from "../types/notification";
import { ITable } from "../types/ITable";

export const notifyAndEmit = async (table: ITable, type: ENotificationType, additionalMessages: string[], tokensKey: string) => {
  const { id, name } = table;

  const notificationConfig = {
    notificationType: type,
    messageConfig: { tableName: name, additionalMessages },
    tokensKey,
  };

  await notificationSender.sendNotification(notificationConfig);

  waiterNamespace.to(id).emit("notification", { notificationType: type, tableId: id, additionalMessages });
  await redis.sadd(`notifications:${id}`, type);
};
