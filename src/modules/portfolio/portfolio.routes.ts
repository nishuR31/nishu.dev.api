import { FastifyInstance } from "fastify";
import { PortfolioController } from "./portfolio.controller";

export default async function portfolioRoutes(fastify: FastifyInstance) {
  // Public Route
  fastify.get("/", PortfolioController.getPortfolio);
  
  // Protected Developer Routes
  fastify.post("/profile", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.updateProfile);

  // Projects
  fastify.post("/projects", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.createProject);
  fastify.put("/projects/:id", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.updateProject);
  fastify.delete("/projects/:id", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.deleteProject);

  // Experiences
  fastify.post("/experiences", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.createExperience);
  fastify.put("/experiences/:id", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.updateExperience);
  fastify.delete("/experiences/:id", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.deleteExperience);

  // Certificates
  fastify.post("/certificates", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.createCertificate);
  fastify.put("/certificates/:id", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.updateCertificate);
  fastify.delete("/certificates/:id", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.deleteCertificate);

  // Upload Media
  fastify.post("/upload", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.uploadMedia);
}
