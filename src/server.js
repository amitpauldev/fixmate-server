import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

const startServer = async () => {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`FixMate server listening on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start FixMate server", error);
  process.exitCode = 1;
});
