import { FastifyInstance } from "fastify";
import { AuthController } from "./auth.controller";

const authRoutes = async (fastify: FastifyInstance) => {
  fastify.post("/register", AuthController.register);
  fastify.post("/login", AuthController.login);
  fastify.post("/logout", AuthController.logout);

  // Protected Routes
  fastify.get("/me", { preValidation: [fastify.authorizeDeveloper] }, AuthController.me);
  fastify.post("/2fa/setup", { preValidation: [fastify.authorizeDeveloper] }, AuthController.setup2FA);
};

export default authRoutes;
