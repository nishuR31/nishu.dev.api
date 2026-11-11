import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import path from "path";

import { sendSuccess } from "../../utils/common/response";
import prisma from "../../providers/db.provider";
import { DATABASE_URL, REDIS } from "../../config/envConfig";

function getPackageVersion(): string {
  try {
    const pkgPath = path.resolve(__dirname, "../../../package.json");
    if (fs.existsSync(pkgPath)) {
      const data = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      return data.version || "1.0.0";
    }
  } catch {}
  return "1.0.0";
}

const IIT_SITTING_ASCII = `#                            .......::::.
#                              ...........
#                               ........
#
#                                   ...:--:. .
#                         .::. .--===++**++-
#                     :-..---:::-=+++++++++-
#                     - :=---::=-==+=-:.--=+:
#                     :.:=++*++*++*#++++++*-
#                       .==++**+=+********+.
#                       .-==++==--===****+:
#                  ....:..:-------===-=+=::::...
#              .::::: .:  ..:-========:..:::------::..
#         .::---:::..  .   ....:::-==:.  -:..::::::----:
#       :----::::::...       .. ..-- .:  :-: .::::.::---:
#      :.:::::::::::..  ..:. .:--:.  :: .:-:. .:....::::.:
#     ......:::::::..:  .:::        .:. :::::. :.... .:..:.
#    ......  ::::::.::.  .:-:       ::   :::::... .. .....:
#     .:.... .::::::::. .. .-.     ::.  .-::::::. .    ...:.
#    . ..  .. .:::...::. :: ::    .::  .:::::::..     .....:
#    .  .:.     .:.  :::  .  :    ::  .:..:.....       .. ..
#    ..   ::.     :. :::.    .. :::--:... ..        ..     .
#     ...  ..      . ::....  .. .-: .  ..               .  .
#   .  ....  .       .....    ..::                   .......
#  ..  ........      ....     ....                     ....
#   :.   ..          ...      .                            ..
#    ..:......       .                                    ..
#      .::...                                          ...
#        ......                .:..........       .......:....
#       ....::::.               -***+*++**.     ..............
#         ...:::::.        :::::=*********:      .......:::.
#           ...:.....      -**************:        ::......
#             ..:.....     :**************:      . ...::....
#               .:::...    .+*************:      ...::...:.:.
#                .....::.   +*********=---.      ..:::..  ..
#                    ..:::..=***+++***-          ..::..`;

export default async function serverRoutes(fastify: FastifyInstance) {
  fastify.get("/health", health);
  fastify.get("/ping", ping);
  fastify.get("/robots.txt", robotsTxt);
  fastify.get("/llms.txt", llmsTxt);
  fastify.get("/llms-full.txt", llmsFullTxt);

  fastify.get("/", start);
}

export const robotsTxt = async (req: FastifyRequest, res: FastifyReply) => {
  const version = getPackageVersion();
  const text = `# ==============================================================================
# api.nishu.dev -- just build it.
# Version: ${version}
# ==============================================================================
#
${IIT_SITTING_ASCII}
#
# ==============================================================================
# Human? Crawl with grace. LLM? Check out /llms.txt
# ==============================================================================

User-agent: *
Allow: /health
Allow: /docs
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /robots.txt
Allow: /api/portfolio
Disallow: /admin/
Disallow: /api/auth/
Disallow: /api/settings

Sitemap: https://nishudevportfolio.vercel.app/sitemap.xml
`;
  return res.type("text/plain; charset=utf-8").send(text);
};

export const llmsTxt = async (req: FastifyRequest, res: FastifyReply) => {
  const version = getPackageVersion();
  const text = `# Nishu API Services (nishu.dev.api)
> Unified backend services powering nishu.dev: developer portfolio data, verified testimonials workflow, and CRM.

- **Base URL**: http://localhost:4000 (Production: https://nishu-dev.onrender.com)
- **Version**: ${version}
- **Developer**: Nishan Rajak (Nishu)
- **Documentation**: /docs

## Public Endpoints
- \`GET /health\` - System health and database/redis status
- \`GET /robots.txt\` - Crawling policies with ASCII art & version
- \`GET /llms.txt\` - Machine-readable LLM overview
- \`GET /api/portfolio\` - Public allowlisted portfolio data (including approved testimonials)
- \`GET /api/portfolio/testimonials/config\` - Testimonial submission constraints & config
- \`POST /api/portfolio/testimonials/verification\` - Request verification code for testimonial
- \`POST /api/portfolio/testimonials/verification/confirm\` - Confirm verification code
- \`POST /api/portfolio/testimonials/submit\` - Submit a testimonial for moderation

## Testimonials Collection System
- All public submissions enter \`PENDING\` status.
- Testimonials are published only after authenticated review and approval by the owner.
- Full details at /llms-full.txt
`;
  return res.type("text/plain; charset=utf-8").send(text);
};

export const llmsFullTxt = async (req: FastifyRequest, res: FastifyReply) => {
  const version = getPackageVersion();
  const text = `# Nishu API Services - Full LLM Context & Specification
Version: ${version}

## Overview
This API provides full-stack and portfolio services for Nishan Rajak (https://nishudevportfolio.vercel.app).
Built with Bun, Fastify, TypeScript, PostgreSQL (Prisma), Redis, and WebAuthn/Passkeys.

## Architecture
- Backend: Fastify with modular architecture under \`src/modules/\`
- Auth: JWT with HttpOnly cookies, WebAuthn passkeys, 2FA/TOTP
- Cache: Redis-backed portfolio caching with atomic invalidation
- Database: PostgreSQL pooled connection with Prisma ORM
- Public Testimonials Moderation:
  - Strict input validation with Zod
  - Rate-limited email challenges
  - Cryptographic token generation & single-use invitation hashing
  - Allowlisted public response filtering (no private fields leaked)
`;
  return res.type("text/plain; charset=utf-8").send(text);
};

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
