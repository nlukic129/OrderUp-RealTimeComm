export enum ENotificationType {
  CALL_WAITER = "CALL_WAITER",
  WAITER_COMING = "WAITER_COMING",
  PAY = "PAY",
  MESSAGE = "MESSAGE",
  NEW_ORDER = "NEW_ORDER",
  ORDER_APPROVAL = "ORDER_APPROVAL",
}

export interface INotificationConfig {
  notificationType: ENotificationType;
  messageConfig: any;
  tokensKey: string;
}
