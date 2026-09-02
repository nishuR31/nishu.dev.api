import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import prisma from "../providers/db.provider";
import { COOKIE_SECRET, JWT_SECRET } from "../config/envConfig";
import { sendError, sendUnauthorizedError } from "../utils/common/response";

export default fp(async (fastify: FastifyInstance) => {
  fastify.register(fastifyCookie, {
    secret: COOKIE_SECRET, 
    parseOptions: {} 
  });

  fastify.register(fastifyJwt, {
    secret: JWT_SECRET,
    cookie: {
      cookieName: 'access_token',
      signed: false
    }
  });

  // Decorate fastify instance with authentication middleware
  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      sendUnauthorizedError(reply, "Unauthorized: Invalid or missing token.");
    }
  });

  // Decorate fastify instance with developer role authorization
  fastify.decorate("authorizeDeveloper", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      
      const payload = request.user as { id: string; role: string };
      
      if (payload.role !== "developer") {
        return sendError(reply, "Forbidden: Developer role required.", 403);
      }

      // Ensure user still exists
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user || user.role !== "developer") {
        return sendError(reply, "Forbidden: Access revoked.", 403);
      }

    } catch (err) {
      sendUnauthorizedError(reply, "Unauthorized: Invalid or missing token.");
    }
  });
});

declare module "fastify" {
  export interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorizeDeveloper: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
