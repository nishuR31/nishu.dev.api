import { PrismaClient } from "@prisma/client";
import config from "../src/data/index";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create single developer user
  const passwordHash = await bcrypt.hash("developer123!", 10);

  let user = await prisma.user.findUnique({ where: { email: config.developer.email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: config.developer.email,
        passwordHash,
        role: "developer",
      },
    });
    console.log(`Created user: ${user.email}`);
  }

  const isForce = process.argv.includes("--force") || process.env.FORCE_SEED === "true";

  // Check if portfolio already exists
  let portfolio = await prisma.portfolioData.findUnique({ where: { userId: user.id } });

  if (portfolio && isForce) {
    console.log("Force seed requested. Cleaning up existing portfolio records...");
    await prisma.skill.deleteMany({
      where: { skillCategory: { portfolioId: portfolio.id } },
    });
    await prisma.skillCategory.deleteMany({ where: { portfolioId: portfolio.id } });
    await prisma.project.deleteMany({ where: { portfolioId: portfolio.id } });
    await prisma.experience.deleteMany({ where: { portfolioId: portfolio.id } });
    await prisma.education.deleteMany({ where: { portfolioId: portfolio.id } });
    await prisma.certificate.deleteMany({ where: { portfolioId: portfolio.id } });
    await prisma.cV.deleteMany({ where: { portfolioId: portfolio.id } });
    await prisma.navItem.deleteMany({ where: { portfolioId: portfolio.id } });
    await prisma.social.deleteMany({ where: { portfolioId: portfolio.id } });
    await prisma.service.deleteMany({ where: { portfolioId: portfolio.id } });
    await prisma.testimonial.deleteMany({ where: { portfolioId: portfolio.id } });
    await prisma.portfolioSnapshot.deleteMany({ where: { portfolioId: portfolio.id } });
    await prisma.contactMessage.deleteMany({ where: { portfolioId: portfolio.id } });
    await prisma.portfolioData.delete({ where: { id: portfolio.id } });
    portfolio = null;
    console.log("Existing portfolio data cleaned successfully.");
  }

  if (!portfolio) {
    portfolio = await prisma.portfolioData.create({
      data: {
        name: config.developer.name,
        shortName: config.developer.shortName,
        role: config.developer.role,
        tagline: config.developer.tagline,
        bio: config.developer.bio,
        location: config.developer.location,
        email: config.developer.email,
        about: config.developer.about,
        recentTracks: config.recentTracks,
        showEducation: (config as any).showEducation ?? false,
        userId: user.id,
      },
    });
    console.log("Created Portfolio Data.");

    // Seed Social
    await prisma.social.create({
      data: {
        email: config.social.email,
        github: config.social.github,
        linkedin: config.social.linkedin,
        discord: config.social.discord,
        twitter: config.social.twitter,
        leetcode: config.social.leetcode,
        hackerone: config.social.hackerone,
        hackerrank: config.social.hackerrank,
        githubFollowers: config.social.githubFollowers || 0,
        githubRepos: config.social.githubRepos || 0,
        leetcodeSolved: config.social.leetcodeSolved || 0,
        leetcodeRanking: config.social.leetcodeRanking || 0,
        portfolioId: portfolio.id,
      },
    });

    // Seed NavItems
    for (const nav of config.NAV_ITEMS) {
      await prisma.navItem.create({
        data: {
          href: nav.href,
          label: nav.label,
          portfolioId: portfolio.id,
        },
      });
    }

    // Seed Projects
    for (const proj of config.projects) {
      await prisma.project.create({
        data: {
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
          featured:
            proj.featured ??
            (config as any).featuredProjects?.includes(proj.title) ??
            false,
          status: proj.status || "Completed",
          architecture: proj.architecture || [],
          company: proj.company || null,
          stars: proj.stars || 0,
          visible: proj.visible ?? true,
          portfolioId: portfolio.id,
        },
      });
    }

    // Seed Skills
    for (const cat of config.skills) {
      const dbCat = await prisma.skillCategory.create({
        data: {
          title: cat.title,
          iconKey: cat.iconKey,
          description: cat.description,
          bgClass: cat.bgClass,
          iconClass: cat.iconClass,
          portfolioId: portfolio.id,
        },
      });

      for (const skill of cat.skills) {
        await prisma.skill.create({
          data: {
            name: skill.name,
            level: skill.level,
            hot: skill.hot || false,
            skillCategoryId: dbCat.id,
          },
        });
      }
    }

    // Seed Experiences
    for (const exp of config.experiences) {
      await prisma.experience.create({
        data: {
          position: exp.position,
          company: exp.company,
          period: exp.period,
          location: exp.location,
          description: exp.description,
          responsibilities: exp.responsibilities,
          technologies: exp.technologies,
          visible: exp.visible ?? true,
          portfolioId: portfolio.id,
        },
      });
    }

    // Seed Education
    if ((config as any).education) {
      for (const edu of (config as any).education) {
        await prisma.education.create({
          data: {
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field,
            startDate: edu.startDate,
            endDate: edu.endDate,
            grade: edu.grade,
            visible: edu.visible ?? true,
            portfolioId: portfolio.id,
          },
        });
      }
    }

    // Seed Certificates
    for (const cert of config.certificates) {
      await prisma.certificate.create({
        data: {
          certId: cert.id,
          title: cert.title,
          url: cert.url,
          type: cert.type,
          portfolioId: portfolio.id,
        },
      });
    }

    // Seed CVs
    if (config.cvs) {
      for (const cv of config.cvs) {
        await prisma.cV.create({
          data: {
            cvId: cv.id,
            title: cv.title,
            url: cv.url,
            description: cv.description,
            lastUpdated: cv.lastUpdated,
            portfolioId: portfolio.id,
          },
        });
      }
    }

    // Create public PortfolioSnapshot
    const fullData = await prisma.portfolioData.findUnique({
      where: { id: portfolio.id },
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

    if (fullData) {
      const formatted = {
        developer: {
          name: fullData.name,
          shortName: fullData.shortName,
          role: fullData.role,
          tagline: fullData.tagline,
          bio: fullData.bio,
          location: fullData.location,
          email: fullData.email,
          about: fullData.about,
        },
        social: fullData.social,
        NAV_ITEMS: fullData.navItems,
        projects: fullData.projects,
        skills: fullData.skills,
        experiences: fullData.experiences,
        certificates: fullData.certificates,
        cvs: fullData.cvs,
        services: fullData.services,
        testimonials: fullData.testimonials,
        education: fullData.education,
        featuredProjects: fullData.projects.filter((p) => p.featured).map((p) => p.title),
        recentTracks: fullData.recentTracks,
        keywords: fullData.keywords,
        showAbout: fullData.showAbout,
        showSkills: fullData.showSkills,
        showExperience: fullData.showExperience,
        showProjects: fullData.showProjects,
        showEducation: fullData.showEducation,
        showCertificates: fullData.showCertificates,
        showServices: fullData.showServices,
        showTestimonials: fullData.showTestimonials,
        maintenanceMode: fullData.maintenanceMode,
      };

      await prisma.portfolioSnapshot.upsert({
        where: { portfolioId: portfolio.id },
        update: { data: formatted, version: { increment: 1 } },
        create: { portfolioId: portfolio.id, data: formatted, version: 1 },
      });
      console.log("Created public Portfolio Snapshot.");
    }

    // Invalidate Redis cache
    try {
      const Redis = (await import("ioredis")).default;
      const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
        lazyConnect: true,
        maxRetriesPerRequest: 0,
        retryStrategy: () => null,
      });
      redis.on("error", () => {});
      await redis.connect();
      await redis.del("portfolio_data");
      await redis.quit();
      console.log("Cleared Redis portfolio_data cache.");
    } catch {
      // Ignore if redis is unavailable during seed
    }

    console.log("Database seeded successfully from index.ts!");
  } else {
    console.log("Database already seeded. Use --force to reseed.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
