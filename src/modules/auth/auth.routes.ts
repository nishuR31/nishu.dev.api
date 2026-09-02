import { FastifyInstance } from "fastify";
import { AuthController } from "./auth.controller";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/register", AuthController.register);
  fastify.post("/login", AuthController.login);
  fastify.post("/logout", AuthController.logout);
  
  // Protected Routes
  fastify.post("/2fa/setup", { preValidation: [fastify.authorizeDeveloper] }, AuthController.setup2FA);
}
