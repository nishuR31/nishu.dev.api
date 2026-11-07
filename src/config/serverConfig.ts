import fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { sendSuccess } from "../utils/common/response";
import { NODE_ENV, CORS_ORIGIN, FRONTEND_URL, REDIS } from "./envConfig";

let app = fastify({ logger: true, exposeHeadRoutes: true });

const allowedOrigins = [
  ...new Set(
    [...CORS_ORIGIN.split(","), FRONTEND_URL]
      .map((origin) => origin.trim())
      .filter(Boolean),
  ),
];

app.register(cors, { origin: allowedOrigins, credentials: true });

import authPlugin from "../plugins/auth.plugin";
import authRoutes from "../modules/auth/auth.routes";
import portfolioRoutes from "../modules/portfolio/portfolio.routes";
import serverRoutes from "../modules/server/server.routes";
import settingsRoutes from "../modules/settings/settings.routes";
import llmRoutes from "../modules/llm/llm.routes";
import fastifyStatic from "@fastify/static";
import fastifyRedis from "@fastify/redis";
import fastifyMultipart from "@fastify/multipart";
import path from "path";
import fastifySocketIo from "fastify-socket.io";

app.register(authPlugin);
app.register(fastifyMultipart, {
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024,
  },
});

if (REDIS) {
  app.register(fastifyRedis, { url: REDIS });
}

app.register(fastifySocketIo, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.ready().then(() => {
  if ((app as any).io) {
    (app as any).io.on("connection", (socket: any) => {
      console.log("Socket connected:", socket.id);
      socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
      });
    });
  }
});

app.addHook("onRequest", async (request, reply) => {
  request.log.info(
    {
      url: request.url,
      method: request.method,
      origin: request.headers.origin,
      hasAccessCookie: Boolean(request.cookies.access_token),
    },
    "Incoming request",
  );
});

app.addHook("onResponse", async (request, reply) => {
  request.log.info(
    {
      url: request.url,
      method: request.method,
      statusCode: reply.statusCode,
      responseTimeMs: Math.round(reply.getResponseTime()),
    },
    "Request completed",
  );
});

// Global Maintenance Mode Middleware
app.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
  // Allow developer auth paths, settings paths, and CRM static assets
  if (
    request.url.startsWith("/api/auth") ||
    request.url.startsWith("/api/settings") ||
    request.url.startsWith("/admin") ||
    request.url.startsWith("/assets") ||
    request.url.startsWith("/api/portfolio") ||
    request.url.startsWith("/api/llm")
  ) {
    return;
  }

  // Maintenance check logic removed due to missing SystemSettings model
});

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

// Serve CRM Dashboard Frontend
app.register(fastifyStatic, {
  root: path.join(__dirname, "../../dist/client"),
  prefix: "/admin/",
  wildcard: true, // Allow wildcard so CSS/JS assets are served
});

app.get("/admin", (req: FastifyRequest, reply: FastifyReply) => {
  reply.redirect("/admin/");
});

app.register(authRoutes, { prefix: "/api/auth" });
app.register(portfolioRoutes, { prefix: "/api/portfolio" });
app.register(settingsRoutes, { prefix: "/api/settings" });
app.register(llmRoutes, { prefix: "/api/llm" });

app.register(serverRoutes);

export default app;
export type { app };
