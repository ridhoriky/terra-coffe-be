import pino from "pino";
import { config } from "../../config/app.config.js";

const isProduction = config.nodeEnv === "production";

const options: pino.LoggerOptions = {
  level: isProduction ? "info" : "debug",
  base: {
    env: config.nodeEnv,
  },
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
};

if (!isProduction) {
  options.transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss Z",
      ignore: "pid,hostname",
    },
  };
}

export const logger = pino(options);
