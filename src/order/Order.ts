import { customerNamespace, notificationSender, orderManager, redis, waiterNamespace } from "../app";
import { ENotificationType } from "../types/notification";
import { ITable } from "../types/ITable";
import { Item } from "../types/Item";
import { handleError } from "../utils/handleError";
import { margeItems } from "../utils/margeItems";

export class Order {
  private items: Array<Item>;
  private table: ITable;
  private timer: NodeJS.Timeout | null = null;

  constructor(table: ITable, items: Array<Item>) {
    this.items = items;
    this.table = table;
    this.sendOrderWithDelay();
  }

  addItem(items: Array<Item>) {
    // ! uvek se salju svi customAdditions za neko jelo, jedino mu se razlikuju choices
    this.items = margeItems(this.items, items);
    this.sendOrderWithDelay();
  }

  private async sendOrderWithDelay() {
    this.clearTimer();
    this.timer = setTimeout(() => this.sendOrder(), 5000);
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private async sendOrder() {
    try {
      const redisPendingItems = await redis.get(`orders:pending:${this.table.id}`);

      let mergedItems = this.items;

      if (redisPendingItems) {
        const oldItems: Array<Item> = JSON.parse(redisPendingItems);
        mergedItems = margeItems(oldItems, this.items);
      }

      await redis.set(`orders:pending:${this.table.id}`, JSON.stringify(mergedItems));

      orderManager.remove(this.table.id);

      waiterNamespace.to(this.table.id).emit("pending-items", { items: mergedItems, tableId: this.table.id });
      customerNamespace.to(this.table.id).emit("pending-items", mergedItems);

      const notificationConfig = {
        notificationType: ENotificationType.NEW_ORDER,
        messageConfig: { tableName: this.table.name },
        tokensKey: `waiters:${this.table.id}`,
      };

      await notificationSender.sendNotification(notificationConfig);
    } catch (error: any) {
      handleError(error, null, `Failed to send order for table ${this.table.id}`);
    }
  }
}
