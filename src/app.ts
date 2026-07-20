import { NODE_ENV } from "./config/envConfig";
// import apiRouter from "./routes/apiRoutes";
import { sendError } from "./utils/common/response";
import fastifyApp from "./config/serverConfig";
import { FastifyReply, FastifyRequest } from "fastify";
const app = fastifyApp;

// app.register(apiRouter, { prefix: "/api" });

app.setNotFoundHandler((_req: FastifyRequest, res: FastifyReply) => {
  return sendError(res, "Route not found", 404);
});

app.setErrorHandler((err: any, _req: FastifyRequest, res: FastifyReply) => {
  const statusCode = err?.statusCode || 500;
  return sendError(res, err?.message || "Something went wrong", statusCode, {
    name: err?.name,
    details: err?.details || {},
    ...(NODE_ENV === "development" ? { stack: err?.stack } : {}),
  });
});

export default app;
