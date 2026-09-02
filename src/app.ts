import { NODE_ENV } from "./config/envConfig";
// import apiRouter from "./routes/apiRoutes";
import { sendError } from "./utils/common/response";
import fastifyApp from "./config/serverConfig";
import { FastifyReply, FastifyRequest } from "fastify";
import path from "path";
const app = fastifyApp;

// app.register(apiRouter, { prefix: "/api" });

app.setNotFoundHandler((req: FastifyRequest, reply: FastifyReply) => {
  if (req.url.startsWith("/admin")) {
    reply.sendFile("index.html", path.join(__dirname, "../dist/client"));
  } else {
    return sendError(reply, "Route not found", 404);
  }
});

app.setErrorHandler((err: any, req: FastifyRequest, res: FastifyReply) => {
  const statusCode = err?.statusCode || 500;
  
  // Log server-side
  req.log.error({
    err,
    requestId: req.id,
    route: req.routeOptions.url,
    method: req.method
  }, err?.message || "Unhandled Error");

  // Keep client response generic in production
  if (NODE_ENV === "production") {
    return sendError(res, statusCode === 500 ? "Internal Server Error" : err?.message, statusCode);
  }

  // Expose details in development
  return sendError(res, err?.message || "Something went wrong", statusCode, {
    name: err?.name,
    details: err?.details || {},
    stack: err?.stack,
  });
});

export default app;
