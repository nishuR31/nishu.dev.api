import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../../providers/db.provider";
import crypto from "crypto";
import {
  PortfolioDataSchema,
  ProjectSchema,
  ExperienceSchema,
  CertificateSchema,
  ServiceSchema,
  TestimonialSchema,
  EducationSchema,
  SkillCategorySchema,
  SocialSchema,
  CVSchema,
  PublicTestimonialSubmissionSchema,
  VerificationStartSchema,
  VerificationConfirmSchema,
  ModerationActionSchema,
  TestimonialSettingsSchema,
} from "./portfolio.schema";
import { StorageProvider } from "../../providers/storage.provider";
import { BUCKET_CERTI, BUCKET_PROJECT } from "../../config/envConfig";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function formatPublicTestimonial(t: any) {
  return {
    id: t.id,
    authorName: t.authorName,
    authorRole: t.authorRole,
    authorCompany: t.authorCompany,
    content: t.content,
    avatarUrl: t.avatarUrl,
    rating: t.rating ?? 5,
    relationship: t.relationship ?? "Collaborator",
    publishedAt: t.publishedAt,
    visible: true,
  };
}

function normalizeProjectImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    const links = value
      .filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      )
      .map((item) => item.trim());
    const first = links[0];
    return first ? (links.length === 1 ? [first, first] : links.slice(0, 2)) : [];
  }

  if (typeof value !== "string" || !value.trim()) return [];
  const raw = value.trim();

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return normalizeProjectImages(parsed);
  } catch {
    // Legacy values may be comma, pipe, or newline separated.
  }

  const links = raw
    .split(/\s*(?:,|\||\r?\n)\s*/)
    .map((link) => link.trim())
    .filter(Boolean);
  const first = links[0];
  return first ? (links.length === 1 ? [first, first] : links.slice(0, 2)) : [];
}

function formatProject(project: any) {
  const { image, images, ...rest } = project;
  return {
    ...rest,
    images: normalizeProjectImages(images ?? image),
  };
}

function projectPersistenceData(project: any) {
  const { image, images, ...rest } = project;
  return {
    ...rest,
    image: JSON.stringify(normalizeProjectImages(images ?? image)),
  };
}

async function fetchSocialStats(social: any) {
  const stats: any = {};

  // Helper to extract just the username if a full URL was provided
  const extractHandle = (input: string) => {
    if (!input) return "";
    try {
      if (input.startsWith("http")) {
        const url = new URL(input);
        // split path and filter out empty strings, then take the first part
        const parts = url.pathname.split("/").filter(Boolean);
        return parts.length > 0 ? parts[0] : input;
      }
    } catch (e) {}
    return input.replace(/^@/, "");
  };

  const githubHandle = extractHandle(social?.github);
  if (githubHandle) {
    try {
      const res = await fetch(`https://api.github.com/users/${githubHandle}`, {
        headers: { "User-Agent": "nishu.dev.api" },
      });
      if (res.ok) {
        const data = await res.json();
        stats.github = {
          followers: data.followers,
          public_repos: data.public_repos,
        };
      }
    } catch (e) {
      console.error("Failed to fetch github stats", e);
    }
  }

  const leetcodeHandle = extractHandle(social?.leetcode);
  if (leetcodeHandle) {
    try {
      const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query getUserProfile($username: String!) { 
            matchedUser(username: $username) { 
              submitStats { acSubmissionNum { difficulty count } } 
              profile { ranking }
            } 
          }`,
          variables: { username: leetcodeHandle },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.data?.matchedUser) {
          const allAc = data.data.matchedUser.submitStats?.acSubmissionNum?.find(
            (x: any) => x.difficulty === "All",
          );
          stats.leetcode = {
            solved: allAc?.count || 0,
            ranking: data.data.matchedUser.profile?.ranking || 0,
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
        include: { social: true },
      });

      if (!portfolio || !portfolio.social) {
        return reply
          .code(404)
          .send({ success: false, message: "Portfolio or social data not found." });
      }

      // Check if we need to sync based on time (1 day) unless forced
      const now = new Date();
      const lastUpdated = new Date(portfolio.social.statsUpdatedAt);
      const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

      if (force !== "true" && hoursSinceUpdate < 24) {
        return reply.send({
          success: true,
          message: "Stats are already up to date.",
          data: portfolio.social,
        });
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
        },
      });

      await PortfolioController.invalidateCache(req);

      return reply.send({
        success: true,
        message: "Social stats synced successfully",
        data: updatedSocial,
      });
    } catch (e: any) {
      return reply.code(500).send({
        success: false,
        message: "Failed to sync social stats",
        errors: e.message,
      });
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
        },
      });

      if (!data)
        return reply.code(404).send({ success: false, message: "No data found." });

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
        projects: data.projects.map(formatProject),
        skills: data.skills,
        experiences: data.experiences,
        certificates: data.certificates,
        cvs: data.cvs,
        services: data.services,
        testimonials: data.testimonials,
        education: data.education,
        featuredProjects: data.projects.filter((p) => p.featured).map((p) => p.title),
        recentTracks: data.recentTracks,
        keywords: data.keywords,
      };

      return reply.send({
        success: true,
        message: "Data exported successfully",
        data: exportObj,
      });
    } catch (e: any) {
      return reply
        .code(500)
        .send({ success: false, message: "Failed to export data", errors: e.message });
    }
  }

  static async getPortfolio(req: FastifyRequest, reply: FastifyReply) {
    try {
      const redis = req.server.redis;
      const CACHE_KEY = "portfolio_data";

      const processResponse = (data: any) => {
        let processedData = data;
        if (processedData && processedData.maintenanceMode) {
          return {
            maintenanceMode: true,
            siteName: processedData.siteName,
            name: processedData.name,
            developer: processedData.developer,
            social: processedData.social,
          };
        }

        if (processedData) {
          processedData = {
            ...processedData,
            projects:
              processedData.projects
                ?.filter((i: any) => i.visible !== false)
                .map(formatProject) || [],
            experiences:
              processedData.experiences?.filter((i: any) => i.visible !== false) || [],
            certificates:
              processedData.certificates?.filter((i: any) => i.visible !== false) || [],
            services:
              processedData.services?.filter((i: any) => i.visible !== false) || [],
            testimonials:
              processedData.testimonials
                ?.filter(
                  (i: any) =>
                    i.visible !== false && (i.status === "APPROVED" || !i.status),
                )
                .map(formatPublicTestimonial) || [],
            education:
              processedData.education?.filter((i: any) => i.visible !== false) || [],
            featuredProjects:
              processedData.projects
                ?.filter((p: any) => p.featured && p.visible !== false)
                .map((p: any) => p.title) || [],
          };
        }
        return processedData;
      };

      if (redis) {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          return reply.send({
            success: true,
            statusCode: 200,
            message: "Portfolio fetched from cache",
            data: processResponse(parsed),
          });
        }
      }

      const snapshot = await prisma.portfolioSnapshot.findFirst({
        orderBy: { createdAt: "desc" },
      });

      if (!snapshot || !snapshot.data) {
        // Fallback or error if no snapshot exists yet
        return reply.code(404).send({
          success: false,
          statusCode: 404,
          message: "Portfolio snapshot not found. Please publish first.",
        });
      }

      // Always overlay live approved testimonials so approved submissions appear immediately
      try {
        const liveApproved = await prisma.testimonial.findMany({
          where: {
            visible: true,
            status: "APPROVED",
          },
          orderBy: { createdAt: "desc" },
        });
        if (Array.isArray((snapshot.data as any).testimonials)) {
          (snapshot.data as any).testimonials = liveApproved;
        }
      } catch (err) {
        req.log.warn({ err }, "Could not fetch live testimonials for portfolio snapshot");
      }

      if (redis) {
        await redis.set(CACHE_KEY, JSON.stringify(snapshot.data), "EX", 3600); // 1 hour TTL
      }

      return reply.send({
        success: true,
        statusCode: 200,
        message: "Portfolio fetched successfully",
        data: processResponse(snapshot.data),
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        statusCode: 500,
        message: "Error fetching portfolio data.",
        errors: error,
      });
    }
  }

  static async getAdminPortfolio(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      let snapshot = await prisma.portfolioSnapshot.findFirst({
        where: { portfolio: { userId: userPayload.id } },
        orderBy: { createdAt: "desc" },
      });

      if (!snapshot || !snapshot.data) {
        const portfolio = await prisma.portfolioData.findUnique({
          where: { userId: userPayload.id },
        });

        if (!portfolio) {
          return reply.code(404).send({
            success: false,
            statusCode: 404,
            message: "Portfolio data not found for the authenticated user.",
          });
        }

        snapshot = await PortfolioController.autoSyncSnapshot(
          portfolio.id,
          req.server.redis,
        );
      }

      if (!snapshot?.data) {
        return reply.code(404).send({
          success: false,
          statusCode: 404,
          message: "Portfolio data could not be loaded.",
        });
      }

      const snapshotData = snapshot.data as any;
      return reply.send({
        success: true,
        statusCode: 200,
        message: "Admin Portfolio fetched successfully",
        data: {
          ...snapshotData,
          projects: snapshotData.projects?.map(formatProject) || [],
        },
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        statusCode: 500,
        message: "Error fetching admin portfolio data.",
        errors: error,
      });
    }
  }

  static async publishPortfolio(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const portfolio = await prisma.portfolioData.findUnique({
        where: { userId: userPayload.id },
      });
      if (!portfolio) {
        return reply.code(404).send({ success: false, message: "Portfolio not found" });
      }

      const result = await PortfolioController.autoSyncSnapshot(
        portfolio.id,
        req.server.redis,
      );
      return reply.send({
        success: true,
        statusCode: 200,
        message: "Portfolio published successfully",
        data: result,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        statusCode: 500,
        message: "Failed to publish portfolio",
        errors: error.message,
      });
    }
  }

  static async autoSyncSnapshot(portfolioId: string, redis: any) {
    const data = await prisma.portfolioData.findUnique({
      where: { id: portfolioId },
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
      },
    });

    if (!data) return null;

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
      projects: data.projects.map(formatProject),
      skills: data.skills,
      experiences: data.experiences,
      certificates: data.certificates,
      cvs: data.cvs,
      services: data.services,
      testimonials: data.testimonials,
      education: data.education,
      featuredProjects: data.projects.filter((p) => p.featured).map((p) => p.title),
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
      maintenanceMode: data.maintenanceMode,
    };

    const snapshot = await prisma.portfolioSnapshot.upsert({
      where: { portfolioId: data.id },
      update: {
        data: formatted,
        version: { increment: 1 },
      },
      create: {
        portfolioId: data.id,
        data: formatted,
        version: 1,
      },
    });

    if (redis) {
      await redis.set("portfolio_data", JSON.stringify(formatted), "EX", 3600);
    }
    return snapshot;
  }

  static async invalidateCache(req: FastifyRequest) {
    const redis = req.server.redis;
    if (redis) {
      await redis.del("portfolio_data");
    }
    try {
      const userPayload = req.user as { id: string } | undefined;
      if (userPayload?.id) {
        const portfolio = await prisma.portfolioData.findUnique({
          where: { userId: userPayload.id },
        });
        if (portfolio) {
          await PortfolioController.autoSyncSnapshot(portfolio.id, redis);

          // Emit socket event to notify connected clients to refresh data
          const io = (req.server as any).io;
          if (io) {
            io.emit("dataRefresh", {
              timestamp: new Date().toISOString(),
              message: "Portfolio data updated",
            });
          }
        }
      }
    } catch (e) {
      console.error("Auto sync failed", e);
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
          userId: userPayload.id,
        },
      });

      await PortfolioController.invalidateCache(req);

      return reply.send({
        success: true,
        statusCode: 200,
        message: "Profile updated successfully",
        data: updated,
      });
    } catch (error) {
      return reply.code(400).send({
        success: false,
        statusCode: 400,
        message: "Failed to update profile",
        errors: error,
      });
    }
  }

  static async updateSocial(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const parsedData = SocialSchema.parse(req.body);
      const portfolio = await prisma.portfolioData.findUnique({
        where: { userId: userPayload.id },
      });
      if (!portfolio)
        return reply.code(404).send({ success: false, message: "Portfolio not found" });

      const updated = await prisma.social.upsert({
        where: { portfolioId: portfolio.id },
        update: parsedData as any,
        create: {
          ...(parsedData as any),
          portfolioId: portfolio.id,
        },
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({
        success: true,
        message: "Social links updated",
        data: updated,
      });
    } catch (error) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to update social", errors: error });
    }
  }

  // --- Projects CRUD ---

  static async bulkUpdateProjects(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const rawArray = req.body as any[];
      if (!Array.isArray(rawArray))
        return reply.code(400).send({ success: false, message: "Expected an array" });
      const portfolio = await prisma.portfolioData.findUnique({
        where: { userId: userPayload.id },
      });
      if (!portfolio)
        return reply.code(404).send({ success: false, message: "Portfolio not found" });
      const parsedArray = rawArray.map((item) =>
        projectPersistenceData(ProjectSchema.parse(item)),
      );
      await prisma.$transaction(async (tx) => {
        await tx.project.deleteMany({ where: { portfolioId: portfolio.id } });
        for (const item of parsedArray) {
          await tx.project.create({
            data: {
              ...item,
              architecture: item.architecture ?? [],
              portfolioId: portfolio.id,
            },
          });
        }
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Projects bulk updated" });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to bulk update Projects", errors: e });
    }
  }

  static async createProject(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const parsedData = projectPersistenceData(ProjectSchema.parse(req.body));
      const portfolio = await prisma.portfolioData.findUnique({
        where: { userId: userPayload.id },
      });
      if (!portfolio)
        return reply.code(404).send({ success: false, message: "Portfolio not found" });

      const project = await prisma.project.create({
        data: {
          ...parsedData,
          architecture: parsedData.architecture ?? [],
          portfolioId: portfolio.id,
        },
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Project created", data: project });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to create project", errors: e });
    }
  }

  static async updateProject(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsedData = projectPersistenceData(ProjectSchema.parse(req.body));
      const params = req.params as { id: string };
      const project = await prisma.project.update({
        where: { id: Number(params.id) },
        data: parsedData,
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Project updated", data: project });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to update project", errors: e });
    }
  }

  static async deleteProject(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as { id: string };
      await prisma.project.delete({ where: { id: Number(params.id) } });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Project deleted" });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to delete project", errors: e });
    }
  }

  // --- Experiences CRUD ---

  static async bulkUpdateExperiences(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const rawArray = req.body as any[];
      if (!Array.isArray(rawArray))
        return reply.code(400).send({ success: false, message: "Expected an array" });
      const portfolio = await prisma.portfolioData.findUnique({
        where: { userId: userPayload.id },
      });
      if (!portfolio)
        return reply.code(404).send({ success: false, message: "Portfolio not found" });
      const parsedArray = rawArray.map((item) => ExperienceSchema.parse(item));
      await prisma.$transaction(async (tx) => {
        await tx.experience.deleteMany({ where: { portfolioId: portfolio.id } });
        for (const item of parsedArray) {
          await tx.experience.create({ data: { ...item, portfolioId: portfolio.id } });
        }
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Experiences bulk updated" });
    } catch (e) {
      return reply.code(400).send({
        success: false,
        message: "Failed to bulk update Experiences",
        errors: e,
      });
    }
  }

  static async createExperience(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const parsedData = ExperienceSchema.parse(req.body);
      const portfolio = await prisma.portfolioData.findUnique({
        where: { userId: userPayload.id },
      });
      if (!portfolio)
        return reply.code(404).send({ success: false, message: "Portfolio not found" });

      const exp = await prisma.experience.create({
        data: { ...parsedData, portfolioId: portfolio.id },
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Experience created", data: exp });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to create experience", errors: e });
    }
  }

  static async updateExperience(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsedData = ExperienceSchema.parse(req.body);
      const params = req.params as { id: string };
      const exp = await prisma.experience.update({
        where: { id: params.id },
        data: parsedData,
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Experience updated", data: exp });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to update experience", errors: e });
    }
  }

  static async deleteExperience(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as { id: string };
      await prisma.experience.delete({ where: { id: params.id } });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Experience deleted" });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to delete experience", errors: e });
    }
  }

  // --- Certificates CRUD ---

  static async bulkUpdateCertificates(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const rawArray = req.body as any[];
      if (!Array.isArray(rawArray))
        return reply.code(400).send({ success: false, message: "Expected an array" });
      const portfolio = await prisma.portfolioData.findUnique({
        where: { userId: userPayload.id },
      });
      if (!portfolio)
        return reply.code(404).send({ success: false, message: "Portfolio not found" });
      const parsedArray = rawArray.map((item) => CertificateSchema.parse(item));
      await prisma.$transaction(async (tx) => {
        await tx.certificate.deleteMany({ where: { portfolioId: portfolio.id } });
        for (const item of parsedArray) {
          await tx.certificate.create({ data: { ...item, portfolioId: portfolio.id } });
        }
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Certificates bulk updated" });
    } catch (e) {
      return reply.code(400).send({
        success: false,
        message: "Failed to bulk update Certificates",
        errors: e,
      });
    }
  }

  static async createCertificate(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const parsedData = CertificateSchema.parse(req.body);
      const portfolio = await prisma.portfolioData.findUnique({
        where: { userId: userPayload.id },
      });
      if (!portfolio)
        return reply.code(404).send({ success: false, message: "Portfolio not found" });

      const cert = await prisma.certificate.create({
        data: { ...parsedData, portfolioId: portfolio.id },
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Certificate created", data: cert });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to create certificate", errors: e });
    }
  }

  static async updateCertificate(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsedData = CertificateSchema.parse(req.body);
      const params = req.params as { id: string };
      const cert = await prisma.certificate.update({
        where: { id: params.id },
        data: parsedData,
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Certificate updated", data: cert });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to update certificate", errors: e });
    }
  }

  static async deleteCertificate(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as { id: string };
      await prisma.certificate.delete({ where: { id: params.id } });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Certificate deleted" });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to delete certificate", errors: e });
    }
  }

  // --- Services CRUD ---

  static async bulkUpdateServices(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const rawArray = req.body as any[];
      if (!Array.isArray(rawArray))
        return reply.code(400).send({ success: false, message: "Expected an array" });
      const portfolio = await prisma.portfolioData.findUnique({
        where: { userId: userPayload.id },
      });
      if (!portfolio)
        return reply.code(404).send({ success: false, message: "Portfolio not found" });
      const parsedArray = rawArray.map((item) => ServiceSchema.parse(item));
      await prisma.$transaction(async (tx) => {
        await tx.service.deleteMany({ where: { portfolioId: portfolio.id } });
        for (const item of parsedArray) {
          await tx.service.create({ data: { ...item, portfolioId: portfolio.id } });
        }
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Services bulk updated" });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to bulk update Services", errors: e });
    }
  }

  static async createService(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const parsedData = ServiceSchema.parse(req.body);
      const portfolio = await prisma.portfolioData.findUnique({
        where: { userId: userPayload.id },
      });
      if (!portfolio)
        return reply.code(404).send({ success: false, message: "Portfolio not found" });

      const service = await prisma.service.create({
        data: { ...parsedData, portfolioId: portfolio.id },
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Service created", data: service });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to create service", errors: e });
    }
  }

  static async updateService(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsedData = ServiceSchema.parse(req.body);
      const params = req.params as { id: string };
      const service = await prisma.service.update({
        where: { id: params.id },
        data: parsedData,
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Service updated", data: service });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to update service", errors: e });
    }
  }

  static async deleteService(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as { id: string };
      await prisma.service.delete({ where: { id: params.id } });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Service deleted" });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to delete service", errors: e });
    }
  }

  // --- Testimonials CRUD & Moderation ---

  static async getPublicTestimonialConfig(req: FastifyRequest, reply: FastifyReply) {
    try {
      let settings = await prisma.testimonialSettings.findFirst();
      if (!settings) {
        settings = await prisma.testimonialSettings.create({
          data: {
            collectionEnabled: true,
            emailVerificationReq: true,
            autoPublish: false,
            duplicateDetection: true,
          },
        });
      }

      return reply.send({
        success: true,
        data: {
          enabled: settings.collectionEnabled,
          emailVerificationRequired: settings.emailVerificationReq,
          maxContentLength: 2000,
          minContentLength: 20,
          consentPolicyVersion: "v1.0",
          relationships: ["Client", "Collaborator", "Colleague", "Mentor", "Other"],
        },
      });
    } catch (e: any) {
      return reply.code(500).send({
        success: false,
        message: "Failed to fetch testimonial configuration",
        errors: e?.message || e,
      });
    }
  }

  static async startEmailVerification(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsed = VerificationStartSchema.parse(req.body);
      const email = parsed.email.toLowerCase().trim();
      const emailDigest = hashToken(email);

      const recentChallenges = await prisma.testimonialVerificationChallenge.count({
        where: {
          emailDigest,
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      });

      if (recentChallenges >= 8) {
        return reply.code(429).send({
          success: false,
          message: "Too many verification requests. Please wait before trying again.",
        });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = hashToken(code);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.testimonialVerificationChallenge.create({
        data: {
          email,
          emailDigest,
          codeHash,
          expiresAt,
        },
      });

      req.log.info({ email, code }, "Testimonial verification challenge generated");

      return reply.send({
        success: true,
        message: "Verification code sent to email.",
        data: {
          email,
          expiresInMinutes: 10,
          previewCode: code,
        },
      });
    } catch (e: any) {
      return reply.code(400).send({
        success: false,
        message: "Failed to initiate email verification",
        errors: e?.message || e,
      });
    }
  }

  static async confirmEmailVerification(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsed = VerificationConfirmSchema.parse(req.body);
      const email = parsed.email.toLowerCase().trim();
      const emailDigest = hashToken(email);
      const codeHash = hashToken(parsed.code);

      const challenge = await prisma.testimonialVerificationChallenge.findFirst({
        where: {
          emailDigest,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!challenge) {
        return reply.code(400).send({
          success: false,
          message: "No active verification challenge found or challenge expired.",
        });
      }

      if (challenge.attemptCount >= 5) {
        return reply.code(400).send({
          success: false,
          message: "Maximum verification attempts exceeded. Please request a new code.",
        });
      }

      if (challenge.codeHash !== codeHash) {
        await prisma.testimonialVerificationChallenge.update({
          where: { id: challenge.id },
          data: { attemptCount: { increment: 1 } },
        });
        return reply.code(400).send({
          success: false,
          message: "Invalid verification code.",
        });
      }

      await prisma.testimonialVerificationChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });

      const tokenPayload = `${email}:${Date.now()}`;
      const verificationToken =
        crypto
          .createHmac("sha256", process.env.COOKIE_SECRET || "verification-secret")
          .update(tokenPayload)
          .digest("hex") + `.${Buffer.from(tokenPayload).toString("base64url")}`;

      return reply.send({
        success: true,
        message: "Email successfully verified",
        data: {
          verificationToken,
          verifiedEmail: email,
        },
      });
    } catch (e: any) {
      return reply.code(400).send({
        success: false,
        message: "Failed to confirm verification code",
        errors: e?.message || e,
      });
    }
  }

  static async submitPublicTestimonial(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = PublicTestimonialSubmissionSchema.parse(req.body);
      const email = body.email.toLowerCase().trim();

      let settings = await prisma.testimonialSettings.findFirst();
      if (settings && !settings.collectionEnabled) {
        return reply.code(403).send({
          success: false,
          message: "Public testimonial collection is currently disabled.",
        });
      }

      let source = "PUBLIC_LINK";
      let invitationId: string | null = null;

      if (body.invitationToken) {
        const tokenHash = hashToken(body.invitationToken.trim());
        const invitation = await prisma.testimonialInvitation.findUnique({
          where: { tokenHash },
        });

        if (
          !invitation ||
          invitation.consumedAt ||
          invitation.revokedAt ||
          invitation.expiresAt < new Date()
        ) {
          return reply.code(400).send({
            success: false,
            message: "Invalid, expired, or previously used invitation token.",
          });
        }

        if (invitation.emailNormalized && invitation.emailNormalized !== email) {
          return reply.code(400).send({
            success: false,
            message: "This invitation is restricted to a different email address.",
          });
        }

        await prisma.testimonialInvitation.update({
          where: { id: invitation.id },
          data: { consumedAt: new Date() },
        });

        source = "INVITATION";
        invitationId = invitation.id;
      }

      const portfolio = await prisma.portfolioData.findFirst();
      if (!portfolio) {
        return reply.code(500).send({
          success: false,
          message: "Portfolio data is not initialized.",
        });
      }

      const existing = await prisma.testimonial.findFirst({
        where: {
          portfolioId: portfolio.id,
          emailNormalized: email,
          status: { in: ["PENDING", "APPROVED"] },
        },
      });

      if (existing) {
        return reply.code(409).send({
          success: false,
          message: "A submission from this email address is already under review or published.",
        });
      }

      const initialStatus = settings?.autoPublish ? "APPROVED" : "PENDING";
      const initialVisible = settings?.autoPublish ? true : false;

      const created = await prisma.testimonial.create({
        data: {
          portfolioId: portfolio.id,
          authorName: body.fullName,
          authorRole: body.role || "Collaborator",
          authorCompany: body.organization || null,
          content: body.testimonial,
          avatarUrl: body.profileUrl || null,
          email,
          emailNormalized: email,
          relationship: body.relationship,
          rating: body.rating,
          status: initialStatus,
          visible: initialVisible,
          source,
          invitationId,
          emailVerifiedAt: new Date(),
          genuineExperienceConfirmedAt: new Date(),
          publicDisplayConsentAt: new Date(),
          consentPolicyVersion: "v1.0",
          publishedAt: initialStatus === "APPROVED" ? new Date() : null,
          reviewedAt: initialStatus === "APPROVED" ? new Date() : null,
        },
      });

      if (initialStatus === "APPROVED") {
        await PortfolioController.invalidateCache(req);
      }

      return reply.send({
        success: true,
        message: "Thank you! Your testimonial has been submitted and is pending review.",
        data: {
          id: created.id,
          status: created.status,
        },
      });
    } catch (e: any) {
      return reply.code(400).send({
        success: false,
        message: "Testimonial submission failed",
        errors: e?.message || e,
      });
    }
  }

  static async getAdminTestimonials(req: FastifyRequest, reply: FastifyReply) {
    try {
      const query = req.query as { status?: string; search?: string };
      const statusFilter = query.status?.toUpperCase();
      const search = query.search?.trim();

      const where: any = {};
      if (statusFilter && ["PENDING", "APPROVED", "REJECTED", "FLAGGED"].includes(statusFilter)) {
        where.status = statusFilter;
      }

      if (search) {
        where.OR = [
          { authorName: { contains: search, mode: "insensitive" } },
          { authorCompany: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      const [items, total, pending, approved, rejected, flagged] = await Promise.all([
        prisma.testimonial.findMany({
          where,
          orderBy: { createdAt: "desc" },
        }),
        prisma.testimonial.count(),
        prisma.testimonial.count({ where: { status: "PENDING" } }),
        prisma.testimonial.count({ where: { status: "APPROVED" } }),
        prisma.testimonial.count({ where: { status: "REJECTED" } }),
        prisma.testimonial.count({ where: { status: "FLAGGED" } }),
      ]);

      let settings = await prisma.testimonialSettings.findFirst();
      if (!settings) {
        settings = await prisma.testimonialSettings.create({
          data: {
            collectionEnabled: true,
            emailVerificationReq: true,
            autoPublish: false,
            duplicateDetection: true,
          },
        });
      }

      return reply.send({
        success: true,
        data: {
          items,
          counts: { total, pending, approved, rejected, flagged },
          settings,
        },
      });
    } catch (e: any) {
      return reply.code(500).send({
        success: false,
        message: "Failed to load moderation testimonials",
        errors: e?.message || e,
      });
    }
  }

  static async moderateTestimonial(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as { id: string };
      const userPayload = req.user as { id: string };
      const { action, moderationNote } = ModerationActionSchema.parse(req.body);

      const existing = await prisma.testimonial.findUnique({
        where: { id: params.id },
      });

      if (!existing) {
        return reply.code(404).send({ success: false, message: "Testimonial not found" });
      }

      let updateData: any = {
        reviewedByAdminId: userPayload.id,
        reviewedAt: new Date(),
      };

      if (moderationNote !== undefined) {
        updateData.moderationNote = moderationNote;
      }

      if (action === "APPROVE") {
        updateData.status = "APPROVED";
        updateData.visible = true;
        updateData.publishedAt = existing.publishedAt || new Date();
      } else if (action === "REJECT") {
        updateData.status = "REJECTED";
        updateData.visible = false;
      } else if (action === "FLAG") {
        updateData.status = "FLAGGED";
      }

      const updated = await prisma.testimonial.update({
        where: { id: params.id },
        data: updateData,
      });

      try {
        await PortfolioController.autoSyncSnapshot(existing.portfolioId, req.server.redis);
      } catch (syncErr) {
        req.log.warn({ syncErr }, "Could not auto-sync snapshot after moderation");
      }

      await PortfolioController.invalidateCache(req);

      return reply.send({
        success: true,
        message: `Testimonial successfully updated (${action})`,
        data: updated,
      });
    } catch (e: any) {
      return reply.code(400).send({
        success: false,
        message: "Failed to moderate testimonial",
        errors: e?.message || e,
      });
    }
  }

  static async createInvitation(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const body = req.body as { email?: string; expiresInDays?: number };

      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashToken(token);
      const days = body.expiresInDays || 7;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      const emailNormalized = body.email ? body.email.toLowerCase().trim() : null;

      const invitation = await prisma.testimonialInvitation.create({
        data: {
          tokenHash,
          emailNormalized,
          expiresAt,
          createdByAdminId: userPayload.id,
        },
      });

      return reply.send({
        success: true,
        message: "Invitation token generated",
        data: {
          id: invitation.id,
          token,
          email: invitation.emailNormalized,
          expiresAt: invitation.expiresAt,
        },
      });
    } catch (e: any) {
      return reply.code(400).send({
        success: false,
        message: "Failed to create invitation",
        errors: e?.message || e,
      });
    }
  }

  static async listInvitations(req: FastifyRequest, reply: FastifyReply) {
    try {
      const invitations = await prisma.testimonialInvitation.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return reply.send({
        success: true,
        data: invitations,
      });
    } catch (e: any) {
      return reply.code(500).send({
        success: false,
        message: "Failed to list invitations",
        errors: e?.message || e,
      });
    }
  }

  static async revokeInvitation(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as { id: string };
      const invitation = await prisma.testimonialInvitation.update({
        where: { id: params.id },
        data: { revokedAt: new Date() },
      });

      return reply.send({
        success: true,
        message: "Invitation revoked",
        data: invitation,
      });
    } catch (e: any) {
      return reply.code(400).send({
        success: false,
        message: "Failed to revoke invitation",
        errors: e?.message || e,
      });
    }
  }

  static async getTestimonialSettings(req: FastifyRequest, reply: FastifyReply) {
    try {
      let settings = await prisma.testimonialSettings.findFirst();
      if (!settings) {
        settings = await prisma.testimonialSettings.create({
          data: {
            collectionEnabled: true,
            emailVerificationReq: true,
            autoPublish: false,
            duplicateDetection: true,
          },
        });
      }

      return reply.send({
        success: true,
        data: settings,
      });
    } catch (e: any) {
      return reply.code(500).send({
        success: false,
        message: "Failed to get settings",
        errors: e?.message || e,
      });
    }
  }

  static async updateTestimonialSettings(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = TestimonialSettingsSchema.parse(req.body);
      let settings = await prisma.testimonialSettings.findFirst();
      if (!settings) {
        settings = await prisma.testimonialSettings.create({
          data: {
            collectionEnabled: body.collectionEnabled ?? true,
            emailVerificationReq: body.emailVerificationReq ?? true,
            autoPublish: body.autoPublish ?? false,
            duplicateDetection: body.duplicateDetection ?? true,
          },
        });
      } else {
        settings = await prisma.testimonialSettings.update({
          where: { id: settings.id },
          data: body,
        });
      }

      return reply.send({
        success: true,
        message: "Settings updated",
        data: settings,
      });
    } catch (e: any) {
      return reply.code(400).send({
        success: false,
        message: "Failed to update settings",
        errors: e?.message || e,
      });
    }
  }

  static async bulkUpdateTestimonials(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const rawArray = req.body as any[];
      if (!Array.isArray(rawArray))
        return reply.code(400).send({ success: false, message: "Expected an array" });
      const portfolio = await prisma.portfolioData.findUnique({
        where: { userId: userPayload.id },
      });
      if (!portfolio)
        return reply.code(404).send({ success: false, message: "Portfolio not found" });
      const parsedArray = rawArray.map((item) => TestimonialSchema.parse(item));
      await prisma.$transaction(async (tx) => {
        await tx.testimonial.deleteMany({ where: { portfolioId: portfolio.id } });
        for (const item of parsedArray) {
          await tx.testimonial.create({ data: { ...item, portfolioId: portfolio.id } });
        }
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Testimonials bulk updated" });
    } catch (e) {
      return reply.code(400).send({
        success: false,
        message: "Failed to bulk update Testimonials",
        errors: e,
      });
    }
  }

  static async createTestimonial(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const parsedData = TestimonialSchema.parse(req.body);
      const portfolio = await prisma.portfolioData.findUnique({
        where: { userId: userPayload.id },
      });
      if (!portfolio)
        return reply.code(404).send({ success: false, message: "Portfolio not found" });

      const testimonial = await prisma.testimonial.create({
        data: { ...parsedData, portfolioId: portfolio.id },
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({
        success: true,
        message: "Testimonial created",
        data: testimonial,
      });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to create testimonial", errors: e });
    }
  }

  static async updateTestimonial(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsedData = TestimonialSchema.parse(req.body);
      const params = req.params as { id: string };
      const testimonial = await prisma.testimonial.update({
        where: { id: params.id },
        data: parsedData,
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({
        success: true,
        message: "Testimonial updated",
        data: testimonial,
      });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to update testimonial", errors: e });
    }
  }

  static async deleteTestimonial(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as { id: string };
      await prisma.testimonial.delete({ where: { id: params.id } });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Testimonial deleted" });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to delete testimonial", errors: e });
    }
  }

  // --- Education CRUD ---
  static async createEducation(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const parsedData = EducationSchema.parse(req.body);
      const portfolio = await prisma.portfolioData.findUnique({
        where: { userId: userPayload.id },
      });
      if (!portfolio)
        return reply.code(404).send({ success: false, message: "Portfolio not found" });

      const edu = await prisma.education.create({
        data: { ...parsedData, portfolioId: portfolio.id },
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Education created", data: edu });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to create education", errors: e });
    }
  }

  static async bulkUpdateEducation(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const rawArray = req.body as unknown[];
      if (!Array.isArray(rawArray))
        return reply.code(400).send({ success: false, message: "Expected an array" });
      const portfolio = await prisma.portfolioData.findUnique({
        where: { userId: userPayload.id },
      });
      if (!portfolio)
        return reply.code(404).send({ success: false, message: "Portfolio not found" });
      const parsedArray = rawArray.map((item) => EducationSchema.parse(item));
      await prisma.$transaction(async (tx) => {
        await tx.education.deleteMany({ where: { portfolioId: portfolio.id } });
        await tx.education.createMany({
          data: parsedArray.map((item) => ({ ...item, portfolioId: portfolio.id })),
        });
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Education bulk updated" });
    } catch (error) {
      return reply.code(400).send({
        success: false,
        message: "Failed to bulk update Education",
        errors: error,
      });
    }
  }

  static async updateEducation(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsedData = EducationSchema.parse(req.body);
      const params = req.params as { id: string };
      const edu = await prisma.education.update({
        where: { id: params.id },
        data: parsedData,
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Education updated", data: edu });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to update education", errors: e });
    }
  }

  static async deleteEducation(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as { id: string };
      await prisma.education.delete({ where: { id: params.id } });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Education deleted" });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to delete education", errors: e });
    }
  }

  // --- Media Upload ---
  static async uploadMedia(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await req.file();
      if (!data) {
        req.log.warn("Upload request did not contain a file");
        return reply.code(400).send({ success: false, message: "No file uploaded" });
      }

      const buffer = await data.toBuffer();
      const folder = "crm-uploads";
      const { assetType = "project" } = req.query as { assetType?: string };
      const bucket =
        assetType === "certificate"
          ? BUCKET_CERTI
          : assetType === "project"
            ? BUCKET_PROJECT
            : null;

      req.log.info(
        {
          filename: data.filename,
          contentType: data.mimetype,
          size: buffer.length,
          assetType,
          bucket,
        },
        "Storage upload requested",
      );

      if (!bucket) {
        return reply.code(400).send({
          success: false,
          message: "Invalid asset type. Use project or certificate.",
        });
      }

      const allowedTypes = new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
        "image/gif",
        "application/pdf",
      ]);

      if (!allowedTypes.has(data.mimetype)) {
        return reply.code(415).send({
          success: false,
          message: "Unsupported file type. Use an image or PDF.",
        });
      }

      let publicUrl = "";

      // Check if image
      if (data.mimetype.startsWith("image/")) {
        // We use StorageProvider to optimize and upload
        publicUrl = await StorageProvider.uploadImage(
          buffer,
          bucket,
          data.filename,
          folder,
        );
      } else {
        // Document (PDF, etc)
        publicUrl = await StorageProvider.uploadDocument(
          buffer,
          bucket,
          data.filename,
          data.mimetype,
          folder,
        );
      }

      return reply.send({
        success: true,
        message: "File uploaded successfully",
        data: { url: publicUrl, filename: data.filename, assetType, bucket },
      });
    } catch (e: any) {
      req.log.error({ error: e, requestId: req.id }, "Storage upload failed");
      return reply.code(500).send({
        success: false,
        message: "Upload failed. Check storage configuration.",
        requestId: req.id,
      });
    }
  }

  static async listMedia(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { assetType } = req.query as { assetType?: string };
      const buckets = [
        { assetType: "project", bucket: BUCKET_PROJECT },
        { assetType: "certificate", bucket: BUCKET_CERTI },
      ];

      const selectedBuckets =
        assetType === "certificate"
          ? buckets.filter((item) => item.bucket === BUCKET_CERTI)
          : assetType === "project"
            ? buckets.filter((item) => item.bucket !== BUCKET_CERTI)
            : buckets;

      if (assetType && !["project", "certificate"].includes(assetType)) {
        return reply.code(400).send({
          success: false,
          message: "Invalid asset type. Use project or certificate.",
        });
      }

      const results = await Promise.allSettled(
        selectedBuckets.flatMap(({ assetType: type, bucket }) =>
          ["", "crm-uploads"].map((folder) =>
            StorageProvider.listFiles(bucket, folder).then((items) =>
              items.map((item) => ({ ...item, assetType: type })),
            ),
          ),
        ),
      );
      const failedBuckets = results.filter((result) => result.status === "rejected");
      const files = results
        .flatMap((result) => {
          if (result.status === "fulfilled") return result.value;
          req.log.warn({ error: result.reason }, "Storage bucket unavailable");
          return [];
        })
        .filter(
          (file, index, allFiles) =>
            allFiles.findIndex(
              (candidate) =>
                candidate.bucket === file.bucket && candidate.path === file.path,
            ) === index,
        );

      if (failedBuckets.length === selectedBuckets.length * 2) {
        return reply.code(502).send({
          success: false,
          message: "Unable to access configured storage buckets.",
          requestId: req.id,
        });
      }

      req.log.info(
        {
          requestedAssetType: assetType || "all",
          buckets: selectedBuckets.map((item) => item.bucket),
          fileCount: files.length,
        },
        "Storage assets listed",
      );

      return reply.send({
        success: true,
        message: "Media listed successfully",
        data: files,
      });
    } catch (error) {
      req.log.error({ error }, "Failed to list media");
      return reply
        .code(500)
        .send({ success: false, message: "Unable to load uploaded assets." });
    }
  }

  static async deleteMedia(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { assetType, path } = req.query as {
        assetType?: string;
        path?: string;
      };
      const bucket =
        assetType === "certificate"
          ? BUCKET_CERTI
          : assetType === "project"
            ? BUCKET_PROJECT
            : null;

      if (!bucket || !path || path.startsWith("/") || path.includes("..")) {
        return reply.code(400).send({
          success: false,
          message: "A valid asset type and storage path are required.",
        });
      }

      req.log.info({ bucket, path, assetType }, "Storage delete requested");
      await StorageProvider.deleteFile(bucket, path);
      req.log.info({ bucket, path, assetType }, "Storage asset deleted");

      return reply.send({
        success: true,
        message: "Asset deleted successfully",
      });
    } catch (error) {
      req.log.error({ error, requestId: req.id }, "Storage delete failed");
      return reply.code(500).send({
        success: false,
        message: "Unable to delete asset.",
        requestId: req.id,
      });
    }
  }

  // --- Database Seed ---

  // --- Skills CRUD ---

  static async bulkUpdateSkills(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const rawArray = req.body as any[];
      if (!Array.isArray(rawArray))
        return reply.code(400).send({ success: false, message: "Expected an array" });
      const portfolio = await prisma.portfolioData.findUnique({
        where: { userId: userPayload.id },
      });
      if (!portfolio)
        return reply.code(404).send({ success: false, message: "Portfolio not found" });

      const parsedArray = rawArray.map((item) => SkillCategorySchema.parse(item));

      await prisma.$transaction(async (tx) => {
        // Delete all existing categories (this should cascade to skills based on schema, but let's be safe)
        const categories = await tx.skillCategory.findMany({
          where: { portfolioId: portfolio.id },
        });
        await tx.skill.deleteMany({
          where: { skillCategoryId: { in: categories.map((c) => c.id) } },
        });
        await tx.skillCategory.deleteMany({ where: { portfolioId: portfolio.id } });

        for (const cat of parsedArray) {
          await tx.skillCategory.create({
            data: {
              title: cat.title,
              iconKey: cat.iconKey,
              description: cat.description,
              bgClass: cat.bgClass,
              iconClass: cat.iconClass,
              portfolioId: portfolio.id,
              skills: {
                create: cat.skills.map((s) => ({
                  name: s.name,
                  level: s.level,
                  hot: s.hot ?? false,
                  yearsOfExperience: s.yearsOfExperience ?? 1,
                })),
              },
            },
          });
        }
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "Skills bulk updated" });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to bulk update Skills", errors: e });
    }
  }

  static async bulkUpdateCVs(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const rawArray = req.body as any[];
      if (!Array.isArray(rawArray))
        return reply.code(400).send({ success: false, message: "Expected an array" });
      const portfolio = await prisma.portfolioData.findUnique({
        where: { userId: userPayload.id },
      });
      if (!portfolio)
        return reply.code(404).send({ success: false, message: "Portfolio not found" });

      const parsedArray = rawArray.map((item) => CVSchema.parse(item));

      await prisma.$transaction(async (tx) => {
        await tx.cV.deleteMany({ where: { portfolioId: portfolio.id } });
        await tx.cV.createMany({
          data: parsedArray.map((cv) => ({
            cvId: cv.cvId,
            title: cv.title,
            url: cv.url,
            description: cv.description,
            lastUpdated: cv.lastUpdated,
            portfolioId: portfolio.id,
          })),
        });
      });
      await PortfolioController.invalidateCache(req);
      return reply.send({ success: true, message: "CVs bulk updated" });
    } catch (e) {
      return reply
        .code(400)
        .send({ success: false, message: "Failed to bulk update CVs", errors: e });
    }
  }
}
