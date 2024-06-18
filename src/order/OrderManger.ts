import { Order } from "./Order";
import { OrderData } from "../types/OrderData";

export class OrderManager {
  private orders: Map<string, Order> = new Map();

  add(order: OrderData): void {
    const { table, items } = order;
    if (this.orders.has(table.id)) {
      const existingOrder = this.orders.get(table.id);
      existingOrder && existingOrder.addItem(items);
    } else {
      const newOrder = new Order(table, items);
      this.orders.set(table.id, newOrder);
    }
  }

  remove(tableId: string): void {
    this.orders.delete(tableId);
  }
}
