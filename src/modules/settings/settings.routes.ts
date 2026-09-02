import { FastifyInstance } from "fastify";
import { SettingsController } from "./settings.controller";

export default async function settingsRoutes(fastify: FastifyInstance) {
  // Public GET route (if we want to expose siteName, etc.)
  fastify.get("/", SettingsController.getSettings);
  
  // Protected Update route
  fastify.post("/", { preValidation: [fastify.authorizeDeveloper] }, SettingsController.updateSettings);
}
