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
        role: "developer"
      }
    });
    console.log(`Created user: ${user.email}`);
  }

  // Check if portfolio already exists
  let portfolio = await prisma.portfolioData.findUnique({ where: { userId: user.id } });

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
        userId: user.id,
      }
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
        portfolioId: portfolio.id,
      }
    });

    // Seed NavItems
    for (const nav of config.NAV_ITEMS) {
      await prisma.navItem.create({
        data: {
          href: nav.href,
          label: nav.label,
          portfolioId: portfolio.id,
        }
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
          featured: config.featuredProjects.includes(proj.title),
          portfolioId: portfolio.id,
        }
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
        }
      });

      for (const skill of cat.skills) {
        await prisma.skill.create({
          data: {
            name: skill.name,
            level: skill.level,
            hot: skill.hot || false,
            skillCategoryId: dbCat.id,
          }
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
          portfolioId: portfolio.id,
        }
      });
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
        }
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
          }
        });
      }
    }

    console.log("Database seeded successfully from index.ts!");
  } else {
    console.log("Database already seeded. Skipping.");
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
