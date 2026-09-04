import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../../providers/db.provider";
import { PortfolioDataSchema, ProjectSchema, ExperienceSchema, CertificateSchema, ServiceSchema, TestimonialSchema, EducationSchema } from "./portfolio.schema";
import { StorageProvider } from "../../providers/storage.provider";
import config from "../../data/index";

async function fetchSocialStats(social: any) {
  const stats: any = {};
  
  // Helper to extract just the username if a full URL was provided
  const extractHandle = (input: string) => {
    if (!input) return "";
    try {
      if (input.startsWith('http')) {
        const url = new URL(input);
        // split path and filter out empty strings, then take the first part
        const parts = url.pathname.split('/').filter(Boolean);
        return parts.length > 0 ? parts[0] : input;
      }
    } catch(e) {}
    return input.replace(/^@/, '');
  };

  const githubHandle = extractHandle(social?.github);
  if (githubHandle) {
    try {
      const res = await fetch(`https://api.github.com/users/${githubHandle}`, {
        headers: { "User-Agent": "nishu.dev.api" }
      });
      if (res.ok) {
        const data = await res.json();
        stats.github = {
          followers: data.followers,
          public_repos: data.public_repos
        };
      }
    } catch (e) {
      console.error("Failed to fetch github stats", e);
    }
  }

  const leetcodeHandle = extractHandle(social?.leetcode);
  if (leetcodeHandle) {
    try {
      const res = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query getUserProfile($username: String!) { 
            matchedUser(username: $username) { 
              submitStats { acSubmissionNum { difficulty count } } 
              profile { ranking }
            } 
          }`,
          variables: { username: leetcodeHandle }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.data?.matchedUser) {
          const allAc = data.data.matchedUser.submitStats?.acSubmissionNum?.find((x: any) => x.difficulty === 'All');
          stats.leetcode = {
            solved: allAc?.count || 0,
            ranking: data.data.matchedUser.profile?.ranking || 0
          };
        }
      }
    } catch (e) {
      console.error("Failed to fetch leetcode stats", e);
    }
  }

  return stats;
}

export class PortfolioController {

  static async syncSocialStats(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { force } = req.query as { force?: string };
      const userPayload = req.user as { id: string };

      const portfolio = await prisma.portfolioData.findUnique({
        where: { userId: userPayload.id },
        include: { social: true }
      });

      if (!portfolio || !portfolio.social) {
        return reply.code(404).send({ success: false, message: "Portfolio or social data not found." });
      }

      // Check if we need to sync based on time (1 day) unless forced
      const now = new Date();
      const lastUpdated = new Date(portfolio.social.statsUpdatedAt);
      const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

      if (force !== 'true' && hoursSinceUpdate < 24) {
        return reply.send({ success: true, message: "Stats are already up to date.", data: portfolio.social });
      }

      const stats = await fetchSocialStats(portfolio.social);
      
      const updatedSocial = await prisma.social.update({
        where: { id: portfolio.social.id },
        data: {
          githubFollowers: stats.github?.followers ?? portfolio.social.githubFollowers,
          githubRepos: stats.github?.public_repos ?? portfolio.social.githubRepos,
          leetcodeSolved: stats.leetcode?.solved ?? portfolio.social.leetcodeSolved,
          leetcodeRanking: stats.leetcode?.ranking ?? portfolio.social.leetcodeRanking,
          statsUpdatedAt: new Date(),
        }
      });

      await PortfolioController.invalidateCache(req.server.redis);

      return reply.send({ success: true, message: "Social stats synced successfully", data: updatedSocial });
    } catch (e: any) {
      return reply.code(500).send({ success: false, message: "Failed to sync social stats", errors: e.message });
    }
  }

  static async exportData(req: FastifyRequest, reply: FastifyReply) {
    try {
      // Dump the DB to JSON structure
      const data = await prisma.portfolioData.findFirst({
        include: {
          social: true,
          navItems: true,
          projects: true,
          skills: { include: { skills: true } },
          experiences: true,
          certificates: true,
          cvs: true,
          services: true,
          testimonials: true,
          education: true,
        }
      });

      if (!data) return reply.code(404).send({ success: false, message: "No data found." });

      const exportObj = {
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
        services: data.services,
        testimonials: data.testimonials,
        education: data.education,
        featuredProjects: data.projects.filter(p => p.featured).map(p => p.title),
        recentTracks: data.recentTracks,
        keywords: data.keywords,
      };

      return reply.send({ success: true, message: "Data exported successfully", data: exportObj });
    } catch (e: any) {
      return reply.code(500).send({ success: false, message: "Failed to export data", errors: e.message });
    }
  }

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
          services: true,
          testimonials: true,
          education: true,
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
        services: data.services,
        testimonials: data.testimonials,
        education: data.education,
        featuredProjects: data.projects.filter(p => p.featured).map(p => p.title),
        recentTracks: data.recentTracks,
        keywords: data.keywords,
        showAbout: data.showAbout,
        showSkills: data.showSkills,
        showExperience: data.showExperience,
        showProjects: data.showProjects,
        showEducation: data.showEducation,
        showCertificates: data.showCertificates,
        showServices: data.showServices,
        showTestimonials: data.showTestimonials,
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

  static async bulkUpdateProjects(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const rawArray = req.body as any[];
      if (!Array.isArray(rawArray)) return reply.code(400).send({ success: false, message: "Expected an array" });
      const portfolio = await prisma.portfolioData.findUnique({ where: { userId: userPayload.id } });
      if (!portfolio) return reply.code(404).send({ success: false, message: "Portfolio not found" });
      const parsedArray = rawArray.map(item => ProjectSchema.parse(item));
      await prisma.$transaction(async (tx) => {
        await tx.project.deleteMany({ where: { portfolioId: portfolio.id } });
        for (const item of parsedArray) {
          await tx.project.create({ data: { ...item, image: item.image ?? "", architecture: item.architecture ?? [], portfolioId: portfolio.id } });
        }
      });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Projects bulk updated" });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to bulk update Projects", errors: e });
    }
  }

  static async createProject(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const parsedData = ProjectSchema.parse(req.body);
      const portfolio = await prisma.portfolioData.findUnique({ where: { userId: userPayload.id } });
      if (!portfolio) return reply.code(404).send({ success: false, message: "Portfolio not found" });

      const project = await prisma.project.create({ data: { ...parsedData, image: parsedData.image ?? "", architecture: parsedData.architecture ?? [], portfolioId: portfolio.id } });
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

  static async bulkUpdateExperiences(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const rawArray = req.body as any[];
      if (!Array.isArray(rawArray)) return reply.code(400).send({ success: false, message: "Expected an array" });
      const portfolio = await prisma.portfolioData.findUnique({ where: { userId: userPayload.id } });
      if (!portfolio) return reply.code(404).send({ success: false, message: "Portfolio not found" });
      const parsedArray = rawArray.map(item => ExperienceSchema.parse(item));
      await prisma.$transaction(async (tx) => {
        await tx.experience.deleteMany({ where: { portfolioId: portfolio.id } });
        for (const item of parsedArray) {
          await tx.experience.create({ data: { ...item, portfolioId: portfolio.id } });
        }
      });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Experiences bulk updated" });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to bulk update Experiences", errors: e });
    }
  }

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

  static async bulkUpdateCertificates(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const rawArray = req.body as any[];
      if (!Array.isArray(rawArray)) return reply.code(400).send({ success: false, message: "Expected an array" });
      const portfolio = await prisma.portfolioData.findUnique({ where: { userId: userPayload.id } });
      if (!portfolio) return reply.code(404).send({ success: false, message: "Portfolio not found" });
      const parsedArray = rawArray.map(item => CertificateSchema.parse(item));
      await prisma.$transaction(async (tx) => {
        await tx.certificate.deleteMany({ where: { portfolioId: portfolio.id } });
        for (const item of parsedArray) {
          await tx.certificate.create({ data: { ...item, portfolioId: portfolio.id } });
        }
      });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Certificates bulk updated" });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to bulk update Certificates", errors: e });
    }
  }

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

  // --- Services CRUD ---

  static async bulkUpdateServices(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const rawArray = req.body as any[];
      if (!Array.isArray(rawArray)) return reply.code(400).send({ success: false, message: "Expected an array" });
      const portfolio = await prisma.portfolioData.findUnique({ where: { userId: userPayload.id } });
      if (!portfolio) return reply.code(404).send({ success: false, message: "Portfolio not found" });
      const parsedArray = rawArray.map(item => ServiceSchema.parse(item));
      await prisma.$transaction(async (tx) => {
        await tx.service.deleteMany({ where: { portfolioId: portfolio.id } });
        for (const item of parsedArray) {
          await tx.service.create({ data: { ...item, portfolioId: portfolio.id } });
        }
      });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Services bulk updated" });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to bulk update Services", errors: e });
    }
  }

  static async createService(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const parsedData = ServiceSchema.parse(req.body);
      const portfolio = await prisma.portfolioData.findUnique({ where: { userId: userPayload.id } });
      if (!portfolio) return reply.code(404).send({ success: false, message: "Portfolio not found" });

      const service = await prisma.service.create({ data: { ...parsedData, portfolioId: portfolio.id } });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Service created", data: service });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to create service", errors: e });
    }
  }

  static async updateService(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsedData = ServiceSchema.parse(req.body);
      const params = req.params as { id: string };
      const service = await prisma.service.update({ where: { id: params.id }, data: parsedData });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Service updated", data: service });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to update service", errors: e });
    }
  }

  static async deleteService(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as { id: string };
      await prisma.service.delete({ where: { id: params.id } });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Service deleted" });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to delete service", errors: e });
    }
  }

  // --- Testimonials CRUD ---

  static async bulkUpdateTestimonials(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const rawArray = req.body as any[];
      if (!Array.isArray(rawArray)) return reply.code(400).send({ success: false, message: "Expected an array" });
      const portfolio = await prisma.portfolioData.findUnique({ where: { userId: userPayload.id } });
      if (!portfolio) return reply.code(404).send({ success: false, message: "Portfolio not found" });
      const parsedArray = rawArray.map(item => TestimonialSchema.parse(item));
      await prisma.$transaction(async (tx) => {
        await tx.testimonial.deleteMany({ where: { portfolioId: portfolio.id } });
        for (const item of parsedArray) {
          await tx.testimonial.create({ data: { ...item, portfolioId: portfolio.id } });
        }
      });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Testimonials bulk updated" });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to bulk update Testimonials", errors: e });
    }
  }

  static async createTestimonial(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const parsedData = TestimonialSchema.parse(req.body);
      const portfolio = await prisma.portfolioData.findUnique({ where: { userId: userPayload.id } });
      if (!portfolio) return reply.code(404).send({ success: false, message: "Portfolio not found" });

      const testimonial = await prisma.testimonial.create({ data: { ...parsedData, portfolioId: portfolio.id } });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Testimonial created", data: testimonial });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to create testimonial", errors: e });
    }
  }

  static async updateTestimonial(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsedData = TestimonialSchema.parse(req.body);
      const params = req.params as { id: string };
      const testimonial = await prisma.testimonial.update({ where: { id: params.id }, data: parsedData });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Testimonial updated", data: testimonial });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to update testimonial", errors: e });
    }
  }

  static async deleteTestimonial(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as { id: string };
      await prisma.testimonial.delete({ where: { id: params.id } });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Testimonial deleted" });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to delete testimonial", errors: e });
    }
  }

  // --- Education CRUD ---
  static async createEducation(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const parsedData = EducationSchema.parse(req.body);
      const portfolio = await prisma.portfolioData.findUnique({ where: { userId: userPayload.id } });
      if (!portfolio) return reply.code(404).send({ success: false, message: "Portfolio not found" });

      const edu = await prisma.education.create({ data: { ...parsedData, portfolioId: portfolio.id } });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Education created", data: edu });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to create education", errors: e });
    }
  }

  static async bulkUpdateEducation(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const rawArray = req.body as unknown[];
      if (!Array.isArray(rawArray)) return reply.code(400).send({ success: false, message: "Expected an array" });
      const portfolio = await prisma.portfolioData.findUnique({ where: { userId: userPayload.id } });
      if (!portfolio) return reply.code(404).send({ success: false, message: "Portfolio not found" });
      const parsedArray = rawArray.map(item => EducationSchema.parse(item));
      await prisma.$transaction(async tx => {
        await tx.education.deleteMany({ where: { portfolioId: portfolio.id } });
        await tx.education.createMany({ data: parsedArray.map(item => ({ ...item, portfolioId: portfolio.id })) });
      });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Education bulk updated" });
    } catch (error) {
      return reply.code(400).send({ success: false, message: "Failed to bulk update Education", errors: error });
    }
  }

  static async updateEducation(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsedData = EducationSchema.parse(req.body);
      const params = req.params as { id: string };
      const edu = await prisma.education.update({ where: { id: params.id }, data: parsedData });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Education updated", data: edu });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to update education", errors: e });
    }
  }

  static async deleteEducation(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as { id: string };
      await prisma.education.delete({ where: { id: params.id } });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Education deleted" });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to delete education", errors: e });
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

  // --- Database Seed ---
  static async seedDatabase(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };

      // Check if data already exists
      const existing = await prisma.portfolioData.findUnique({ where: { userId: userPayload.id } });
      if (existing) {
        return reply.code(400).send({ success: false, message: "Portfolio already seeded" });
      }

      // Start transaction
      const portfolio = await prisma.$transaction(async (tx) => {
        // Create base portfolio
        const p = await tx.portfolioData.create({
          data: {
            userId: userPayload.id,
            name: config.developer.name,
            shortName: config.developer.shortName,
            role: config.developer.role,
            tagline: config.developer.tagline,
            bio: config.developer.bio,
            location: config.developer.location,
            email: config.developer.email,
            about: config.developer.about,
            recentTracks: config.recentTracks,
          }
        });

        // Add Social
        await tx.social.create({
          data: {
            portfolioId: p.id,
            email: config.social.email,
            github: config.social.github,
            linkedin: config.social.linkedin,
            discord: config.social.discord,
            twitter: config.social.twitter,
            leetcode: config.social.leetcode,
            hackerone: config.social.hackerone,
          }
        });

        // Add NavItems
        if (config.NAV_ITEMS) {
          for (const item of config.NAV_ITEMS) {
            await tx.navItem.create({
              data: {
                portfolioId: p.id,
                href: item.href,
                label: item.label,
              }
            });
          }
        }

        // Add Projects
        if (config.projects) {
          for (const proj of config.projects) {
            await tx.project.create({
              data: {
                portfolioId: p.id,
                title: proj.title,
                description: proj.description,
                image: proj.image,
                technologies: proj.technologies,
                github: proj.github,
                demo: proj.demo,
                problem: proj.problem,
                solution: proj.solution,
                role: proj.role,
                timeline: proj.timeline,
                highlights: proj.highlights,
                categories: proj.categories,
                featured: config.featuredProjects.includes(proj.title),
              }
            });
          }
        }

        // Add Skills
        if (config.skills) {
          for (const skillCat of config.skills) {
            const cat = await tx.skillCategory.create({
              data: {
                portfolioId: p.id,
                title: skillCat.title,
                iconKey: skillCat.iconKey,
                description: skillCat.description,
                bgClass: skillCat.bgClass,
                iconClass: skillCat.iconClass,
              }
            });

            for (const skill of skillCat.skills) {
              await tx.skill.create({
                data: {
                  skillCategoryId: cat.id,
                  name: skill.name,
                  level: skill.level,
                  hot: skill.hot || false,
                }
              });
            }
          }
        }

        // Add Experiences
        if (config.experiences) {
          for (const exp of config.experiences) {
            await tx.experience.create({
              data: {
                portfolioId: p.id,
                position: exp.position,
                company: exp.company,
                period: exp.period,
                location: exp.location ?? "",
                description: exp.description ?? "",
                responsibilities: exp.responsibilities,
                technologies: exp.technologies,
              }
            });
          }
        }

        // Add Certificates
        if (config.certificates) {
          for (const cert of config.certificates) {
            await tx.certificate.create({
              data: {
                portfolioId: p.id,
                certId: cert.id ?? "",
                title: cert.title,
                url: cert.url,
                type: cert.type,
              }
            });
          }
        }

        // Add CVs
        if (config.cvs) {
          for (const cv of config.cvs) {
            await tx.cV.create({
              data: {
                portfolioId: p.id,
                cvId: cv.id,
                title: cv.title,
                url: cv.url,
                description: cv.description,
                lastUpdated: cv.lastUpdated ?? "",
              }
            });
          }
        }

        return p;
      }, { timeout: 30000, maxWait: 10000 });

      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "Database seeded successfully", data: portfolio });
    } catch (e: any) {
      console.error(e);
      return reply.code(500).send({ success: false, message: "Failed to seed database", errors: e.message });
    }
  }
}
