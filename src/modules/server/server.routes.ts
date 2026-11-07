import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { sendSuccess } from "../../utils/common/response";
import prisma from "../../providers/db.provider";
import { DATABASE_URL, REDIS } from "../../config/envConfig";

export default async function serverRoutes(fastify: FastifyInstance) {
  fastify.get("/health", health);
  fastify.get("/ping", ping);

  fastify.get("/", start);
}

export const health = async (req: FastifyRequest, res: FastifyReply) => {
  const startedAt = Date.now();
  let prismaConnected = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    prismaConnected = true;
  } catch (error) {
    req.log.error({ error }, "Prisma health check failed");
  }

  const redis = req.server.redis;
  let redisConnected = !REDIS;
  let redisStatus = REDIS ? "not_ready" : "disabled";

  if (redis) {
    redisStatus = redis.status;
    try {
      await redis.ping();
      redisConnected = true;
      redisStatus = redis.status || "ready";
    } catch (error) {
      redisConnected = false;
      req.log.error({ error }, "Redis health check failed");
    }
  } else if (REDIS) {
    redisConnected = false;
  }

  const healthy = prismaConnected && redisConnected;
  const statusCode = healthy ? 200 : 503;

  return res.code(statusCode).send({
    success: healthy,
    statusCode,
    message: healthy ? "Server Healthy" : "Dependency connection failure",
    data: {
      uptime: process.uptime(),
      date: new Date().toISOString(),
      responseTimeMs: Date.now() - startedAt,
      database: {
        configured: Boolean(DATABASE_URL),
        connected: prismaConnected,
      },
      redis: {
        configured: Boolean(REDIS),
        connected: redisConnected,
        status: redisStatus,
      },
    },
  });
};
export const start = async (req: FastifyRequest, res: FastifyReply) => {
  sendSuccess(res, "Server Started", 200, {
    uptime: process.uptime(),
    date: new Date().toLocaleString(),
  });
};

export const ping = async (req: FastifyRequest, res: FastifyReply) => {
  sendSuccess(res, "pong", 200, "pong");
};
