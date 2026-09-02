import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import prisma from "../providers/db.provider";

export default fp(async (fastify: FastifyInstance) => {
  fastify.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || "super-secret-cookie-key", 
    parseOptions: {} 
  });

  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "your-super-secret-jwt-key",
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
      reply.code(401).send({ success: false, statusCode: 401, message: "Unauthorized: Invalid or missing token." });
    }
  });

  // Decorate fastify instance with developer role authorization
  fastify.decorate("authorizeDeveloper", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      
      const payload = request.user as { id: string; role: string };
      
      if (payload.role !== "developer") {
        return reply.code(403).send({ success: false, statusCode: 403, message: "Forbidden: Developer role required." });
      }

      // Ensure user still exists
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user || user.role !== "developer") {
        return reply.code(403).send({ success: false, statusCode: 403, message: "Forbidden: Access revoked." });
      }

    } catch (err) {
      reply.code(401).send({ success: false, statusCode: 401, message: "Unauthorized: Invalid or missing token." });
    }
  });
});

declare module "fastify" {
  export interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorizeDeveloper: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
