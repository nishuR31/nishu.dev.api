import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../../providers/db.provider";
import { PortfolioDataSchema, ProjectSchema, ExperienceSchema, CertificateSchema } from "./portfolio.schema";
import { StorageProvider } from "../../providers/storage.provider";

export class PortfolioController {
  
  static async getPortfolio(req: FastifyRequest, reply: FastifyReply) {
    try {
      const redis = req.server.redis;
      const CACHE_KEY = "portfolio_data";

      if (redis) {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          return reply.send({ success: true, statusCode: 200, message: "Portfolio fetched from cache", data: JSON.parse(cached) });
        }
      }

      const data = await prisma.portfolioData.findFirst({
        include: {
          social: true,
          navItems: true,
          projects: true,
          skills: { include: { skills: true } },
          experiences: true,
          certificates: true,
          cvs: true,
        }
      });
      
      if (!data) {
        return reply.code(404).send({ success: false, statusCode: 404, message: "Portfolio data not found." });
      }

      // Restructure data to match old static JSON structure
      const formatted = {
        developer: {
          name: data.name,
          shortName: data.shortName,
          role: data.role,
          tagline: data.tagline,
          bio: data.bio,
          location: data.location,
          email: data.email,
          about: data.about,
        },
        social: data.social,
        NAV_ITEMS: data.navItems,
        projects: data.projects,
        skills: data.skills,
        experiences: data.experiences,
        certificates: data.certificates,
        cvs: data.cvs,
        featuredProjects: data.projects.filter(p => p.featured).map(p => p.title),
        recentTracks: data.recentTracks,
        keywords: data.keywords,
      };

      if (redis) {
        await redis.set(CACHE_KEY, JSON.stringify(formatted), "EX", 3600); // 1 hour TTL
      }

      return reply.send({ success: true, statusCode: 200, message: "Portfolio fetched successfully", data: formatted });
    } catch (error) {
      return reply.code(500).send({ success: false, statusCode: 500, message: "Error fetching portfolio data.", errors: error });
    }
  }

  static async invalidateCache(redis: any) {
    if (redis) {
      await redis.del("portfolio_data");
    }
  }

  static async updateProfile(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const parsedData = PortfolioDataSchema.parse(req.body);

      const updated = await prisma.portfolioData.upsert({
        where: { userId: userPayload.id },
        update: parsedData,
        create: {
          ...parsedData,
          userId: userPayload.id
        }
      });

      await PortfolioController.invalidateCache(req.server.redis);

      return reply.send({ success: true, statusCode: 200, message: "Profile updated successfully", data: updated });
    } catch (error) {
      return reply.code(400).send({ success: false, statusCode: 400, message: "Failed to update profile", errors: error });
    }
  }

  // --- Projects CRUD ---
  static async createProject(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const parsedData = ProjectSchema.parse(req.body);
      const portfolio = await prisma.portfolioData.findUnique({ where: { userId: userPayload.id } });
      if (!portfolio) return reply.code(404).send({ success: false, message: "Portfolio not found" });

      const project = await prisma.project.create({ data: { ...parsedData, portfolioId: portfolio.id } });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Project created", data: project });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to create project", errors: e });
    }
  }

  static async updateProject(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsedData = ProjectSchema.parse(req.body);
      const params = req.params as { id: string };
      const project = await prisma.project.update({ where: { id: Number(params.id) }, data: parsedData });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Project updated", data: project });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to update project", errors: e });
    }
  }

  static async deleteProject(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as { id: string };
      await prisma.project.delete({ where: { id: Number(params.id) } });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Project deleted" });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to delete project", errors: e });
    }
  }

  // --- Experiences CRUD ---
  static async createExperience(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const parsedData = ExperienceSchema.parse(req.body);
      const portfolio = await prisma.portfolioData.findUnique({ where: { userId: userPayload.id } });
      if (!portfolio) return reply.code(404).send({ success: false, message: "Portfolio not found" });

      const exp = await prisma.experience.create({ data: { ...parsedData, portfolioId: portfolio.id } });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Experience created", data: exp });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to create experience", errors: e });
    }
  }

  static async updateExperience(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsedData = ExperienceSchema.parse(req.body);
      const params = req.params as { id: string };
      const exp = await prisma.experience.update({ where: { id: params.id }, data: parsedData });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Experience updated", data: exp });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to update experience", errors: e });
    }
  }

  static async deleteExperience(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as { id: string };
      await prisma.experience.delete({ where: { id: params.id } });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Experience deleted" });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to delete experience", errors: e });
    }
  }

  // --- Certificates CRUD ---
  static async createCertificate(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const parsedData = CertificateSchema.parse(req.body);
      const portfolio = await prisma.portfolioData.findUnique({ where: { userId: userPayload.id } });
      if (!portfolio) return reply.code(404).send({ success: false, message: "Portfolio not found" });

      const cert = await prisma.certificate.create({ data: { ...parsedData, portfolioId: portfolio.id } });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Certificate created", data: cert });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to create certificate", errors: e });
    }
  }

  static async updateCertificate(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsedData = CertificateSchema.parse(req.body);
      const params = req.params as { id: string };
      const cert = await prisma.certificate.update({ where: { id: params.id }, data: parsedData });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Certificate updated", data: cert });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to update certificate", errors: e });
    }
  }

  static async deleteCertificate(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as { id: string };
      await prisma.certificate.delete({ where: { id: params.id } });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Certificate deleted" });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to delete certificate", errors: e });
    }
  }

  // --- Media Upload ---
  static async uploadMedia(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await req.file();
      if (!data) return reply.code(400).send({ success: false, message: "No file uploaded" });

      const buffer = await data.toBuffer();
      const folder = "crm-uploads";
      const bucket = "portfolio-assets";

      let publicUrl = "";

      // Check if image
      if (data.mimetype.startsWith("image/")) {
        // We use StorageProvider to optimize and upload
        publicUrl = await StorageProvider.uploadImage(buffer, bucket, data.filename, folder);
      } else {
        // Document (PDF, etc)
        publicUrl = await StorageProvider.uploadDocument(buffer, bucket, data.filename, data.mimetype, folder);
      }

      return reply.send({ success: true, message: "File uploaded successfully", data: { url: publicUrl, filename: data.filename } });
    } catch (e: any) {
      console.error(e);
      return reply.code(500).send({ success: false, message: "Upload failed", errors: e.message });
    }
  }
}
