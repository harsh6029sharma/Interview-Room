import pino from "pino";

const loggerConfig = 
  process.env.NODE_ENV !== "production"
    ? {
        level: "debug" as const,
        transport: { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } },
      }
    : {
        level: "info" as const,
      };

export const logger = pino(loggerConfig);