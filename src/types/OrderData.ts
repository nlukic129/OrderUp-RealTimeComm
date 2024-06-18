import { ITable } from "./ITable";
import { Item } from "./Item";

export interface OrderData {
  items: Array<Item>;
  table: ITable;
}
