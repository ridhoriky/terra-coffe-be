import { app } from "./src/app.js";
import { config } from "./src/config/app.config.js";

const startServer = () => {
  try {
    app.listen(config.port, () => {
      console.info(`🚀 Server running in ${config.nodeEnv} mode on port ${config.port}`);
    });
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
};

startServer();
