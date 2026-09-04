import { FastifyInstance } from "fastify";
import { AuthController } from "./auth.controller";

const authRoutes = async (fastify: FastifyInstance) => {
  fastify.post("/register", AuthController.register);
  fastify.post("/login", AuthController.login);
  fastify.post("/logout", AuthController.logout);

  // Protected Routes (requires login)
  fastify.get("/me", { preValidation: [fastify.authorizeDeveloper] }, AuthController.me);
  fastify.post("/2fa/setup", { preValidation: [fastify.authorizeDeveloper] }, AuthController.setup2FA);
  fastify.post("/2fa/disable", { preValidation: [fastify.authorizeDeveloper] }, AuthController.disable2FA);
  fastify.post("/passkey/generate-options", { preValidation: [fastify.authorizeDeveloper] }, AuthController.generatePasskeyOptions);
  fastify.post("/passkey/verify-registration", { preValidation: [fastify.authorizeDeveloper] }, AuthController.verifyPasskeyRegistration);
  
  // Public Passkey Auth Routes
  fastify.post("/passkey/login-options", AuthController.generatePasskeyAuthOptions);
  fastify.post("/passkey/login-verify", AuthController.verifyPasskeyAuthentication);
};

export default authRoutes;
