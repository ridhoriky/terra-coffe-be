import pg from "pg";
import { config } from "@/config/app.config.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Graceful shutdown
process.on("SIGTERM", async (): Promise<void> => {
  console.info("SIGTERM signal received: closing HTTP server");
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async (): Promise<void> => {
  console.info("SIGINT signal received: closing HTTP server");
  await pool.end();
  process.exit(0);
});
