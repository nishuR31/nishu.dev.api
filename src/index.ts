import app from "./app";
import { PORT, NODE_ENV } from "./config/envConfig";

const startServer = async () => {
  try {
    await app.ready();
    const address = await app.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err: any) {
    process.exit(1);
  }
};

startServer();
async function gracefulShutdown(signal: string) {
  app.close(async () => {
    console.log("All connections closed. Goodbye!");
    process.exit(0);
  });

  setTimeout(() => {
    console.log("Shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("unhandledRejection", (reason: any) => {
  console.error("Unhandled Rejection", { error: reason?.message || reason });
});

process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
