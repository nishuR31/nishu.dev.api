import { FastifyInstance } from "fastify";
import { PortfolioController } from "./portfolio.controller";

export default async function portfolioRoutes(fastify: FastifyInstance) {
  // Public Route
  fastify.get("/", PortfolioController.getPortfolio);
  
  // Protected Developer Routes
  fastify.post("/profile", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.updateProfile);
  fastify.post("/seed", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.seedDatabase);

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

  // Services
  fastify.post("/services", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.createService);
  fastify.put("/services/:id", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.updateService);
  fastify.delete("/services/:id", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.deleteService);

  // Testimonials
  fastify.post("/testimonials", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.createTestimonial);
  fastify.put("/testimonials/:id", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.updateTestimonial);
  fastify.delete("/testimonials/:id", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.deleteTestimonial);

  // Education
  fastify.post("/education", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.createEducation);
  fastify.put("/education/:id", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.updateEducation);
  fastify.delete("/education/:id", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.deleteEducation);

  // Upload Media
  fastify.post("/upload", { preValidation: [fastify.authorizeDeveloper] }, PortfolioController.uploadMedia);
}
