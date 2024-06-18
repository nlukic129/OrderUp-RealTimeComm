import { createServer } from "http";
import { Server } from "socket.io";

import { handleWaiterEvents } from "./events/waiterEvents";
import { handleCustomerEvents } from "./events/customerEvents";
import { NotificationSender } from "./firebase/NotificationSender";
import { Redis } from "ioredis";
import { OrderManager } from "./order/OrderManger";
import { redis_uri } from "./config";

// TODO dodati withCredentials u konekciju da bi se slali cookie-ji
// const socket = io('http://your-socket-service-endpoint', {
// withCredentials: true
// });

export const notificationSender = new NotificationSender();

export const redis = new Redis(redis_uri);

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

export const orderManager = new OrderManager();

export const waiterNamespace = io.of("/waiter");
export const customerNamespace = io.of("/customer");

waiterNamespace.on("connection", (socket) => {
  handleWaiterEvents(socket);
});

customerNamespace.on("connection", (socket) => {
  handleCustomerEvents(socket);
});

export default httpServer;
