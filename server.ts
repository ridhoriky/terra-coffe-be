import { app } from "./src/app.js";
import { config } from "./src/config/app.config.js";
import { logger } from "./src/shared/utils/logger.js";

const startServer = (): void => {
  try {
    app.listen(config.port, (): void => {
      logger.info(
        `🚀 Server running in ${config.nodeEnv} mode on port ${config.port}`,
      );
    });
  } catch (error) {
    logger.error(error, "❌ Error starting server");
    process.exit(1);
  }
};

startServer();
