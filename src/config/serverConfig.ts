import fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { sendSuccess } from "../utils/common/response";
import { health, ping, portfolio } from "../controllers/authController";
import PublicRoutes from "../routes/public/publicRoutes";
import { NODE_ENV, CORS_ORIGIN, REDIS } from "./envConfig";

let app = fastify({ logger: true, exposeHeadRoutes: true });

const allowedOrigins = CORS_ORIGIN.split(",").map(origin => origin.trim());

app.register(cors, { origin: allowedOrigins, credentials: true });

import authPlugin from "../plugins/auth.plugin";
import authRoutes from "../modules/auth/auth.routes";
import portfolioRoutes from "../modules/portfolio/portfolio.routes";
import settingsRoutes from "../modules/settings/settings.routes";
import prisma from "../providers/db.provider";
import fastifyStatic from "@fastify/static";
import fastifyRedis from "@fastify/redis";
import fastifyMultipart from "@fastify/multipart";
import path from "path";

app.register(authPlugin);
app.register(fastifyMultipart);

if (REDIS) {
  app.register(fastifyRedis, { url: REDIS });
}

app.addHook("onRequest", async (request, reply) => {
  // Allow API routes to be public (auth middleware will protect specific routes)
  if (request.url.startsWith("/api/")) {
    request.log.info({ url: request.url, cookies: request.cookies }, 'Incoming API Request');
    return;
  }
});

// Global Maintenance Mode Middleware
app.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
  // Allow developer auth paths, settings paths, and CRM static assets
  if (
    request.url.startsWith("/api/auth") ||
    request.url.startsWith("/api/settings") ||
    request.url.startsWith("/admin") ||
    request.url.startsWith("/assets")
  ) {
    return;
  }

  // Skip maintenance check in dev mode for convenience, or allow if token has developer role
  try {
    const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
    if (settings?.maintenanceMode) {
      // If maintenance mode is active, check if user is developer
      try {
        await request.jwtVerify();
        const payload = request.user as { role: string };
        if (payload.role === "developer") {
          return; // Allow developer through
        }
      } catch (err) {
        // Not a developer, block request
        return reply.code(503).send({
          success: false,
          statusCode: 503,
          message: "Service is currently undergoing maintenance. Please try again later."
        });
      }
    }
  } catch (error) {
    // DB not ready or error, let it pass or handle gracefully
  }
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
  wildcard: true // Allow wildcard so CSS/JS assets are served
});

app.get("/admin", (req: FastifyRequest, reply: FastifyReply) => {
  reply.redirect("/admin/");
});

app.register(PublicRoutes);
app.register(authRoutes, { prefix: "/api/auth" });
app.register(portfolioRoutes, { prefix: "/api/portfolio" });
app.register(settingsRoutes, { prefix: "/api/settings" });

app.get("/", (req: FastifyRequest, res: FastifyReply) => {
  return sendSuccess(res, "Server Fired Up", 200, {
    Uptime: process.uptime(),
    Date: new Date().toLocaleString(),
    Documentation: "/docs",
  });
});

export default app;
export type { app };
