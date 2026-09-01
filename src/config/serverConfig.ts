import fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { sendSuccess } from "../utils/common/response";
import { health, ping, portfolio } from "../controllers/authController";
import PublicRoutes from "../routes/public/publicRoutes";
import { NODE_ENV } from "./envConfig";

let app = fastify({ logger: true, exposeHeadRoutes: true });

const allowedOrigins = [
  "https://nishudevportfolio.vercel.app",
  "http://localhost:3000",
];

app.register(cors, { origin: allowedOrigins });

if (NODE_ENV !== "production") {
  app.register(swagger, {
    openapi: {
      info: {
        title: "Portfolio API",
        description: "Portfolio API for nishu.dev",
        version: "1.0.0",
      },
    },
  });

  app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: { deepLinking: true },
    staticCSP: false,
  });
}

app.register(PublicRoutes);

app.get("/", (req: FastifyRequest, res: FastifyReply) => {
  return sendSuccess(res, "Server Fired Up", 200, {
    Uptime: process.uptime(),
    Date: new Date().toLocaleString(),
    Documentation: "/docs",
  });
});

export default app;
export type { app };
