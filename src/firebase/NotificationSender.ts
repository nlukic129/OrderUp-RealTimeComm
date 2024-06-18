import { getMessaging } from "firebase-admin/messaging";
import admin from "firebase-admin";

import { redis } from "../app";
import { notifications } from "./notifications";
import { Notification } from "./notifications";
import { ENotificationType, INotificationConfig } from "../types/notification";

interface NotificationPayload {
  notification: Notification;
  tokens: string[];
}

export class NotificationSender {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert(require("../../orderup-630e4-firebase-adminsdk-wufk7-ebdd62d534.json")),
    });
  }

  sendNotification = async (notificationConfig: INotificationConfig) => {
    const { notificationType, messageConfig, tokensKey } = notificationConfig;

    const tokens = await this.getTokens(tokensKey);
    if (tokens.length) {
      const notification = this.generateNotification(notificationType, messageConfig, tokens);
      await this.send(notification);
    }
  };

  private send = async (notification: NotificationPayload) => {
    if (notification) {
      const response = await getMessaging().sendMulticast(notification);
      console.log(response.successCount + " messages were sent successfully");
    }
  };

  private getTokens = async (tableId: string) => {
    return await redis.smembers(tableId);
  };

  private generateNotification(notificationType: ENotificationType, dynamicValues: any, tokens: string[]): NotificationPayload {
    const notificationTemplate = notifications[notificationType];

    // ! TODO Ne radi dinamicko bindovanje body-a poruke

    if (!notificationTemplate) {
      throw new Error("Invalid notification type");
    }

    const { title, body, image } = notificationTemplate;
    let dynamicTitle = title;
    let dynamicBody = body;

    if (dynamicValues) {
      for (const key in dynamicValues) {
        const regex = new RegExp(`\`${key}\``, "g");
        dynamicTitle = dynamicTitle.replace(regex, dynamicValues[key]);
        dynamicBody = dynamicBody.replace(regex, dynamicValues[key]);
      }
    }

    return {
      notification: {
        title: dynamicTitle,
        body: dynamicBody,
        image: image,
      },
      tokens,
    };
  }
}
