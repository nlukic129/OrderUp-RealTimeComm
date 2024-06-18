import dotenv from "dotenv";

dotenv.config();

export const port = process.env.PORT || 8081;
export const googleApplicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

export const redis_host = process.env.REDIS_HOST || "127.0.0.1";
export const redis_port = Number(process.env.REDIS_PORT) || 6379;
export const redis_username = process.env.REDIS_USERNAME || "";
export const redis_password = process.env.REDIS_PASSWORD || "";

export const redis_uri = process.env.REDIS_URI || `redis://${redis_host}:${redis_port}`;

export const STATIC_SERVICE = process.env.STATIC_SERVICE || "http://localhost:8080";
