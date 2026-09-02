import { z } from "zod";

export const PortfolioDataSchema = z.object({
  name: z.string(),
  shortName: z.string(),
  role: z.string(),
  tagline: z.string(),
  bio: z.string(),
  location: z.string(),
  email: z.string().email(),
  about: z.array(z.string()),
  recentTracks: z.boolean().default(true),
  keywords: z.string().default("portfolio,developer"),
});

export const ProjectSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z.string().optional(),
  technologies: z.array(z.string()),
  github: z.string().url().optional().nullable(),
  demo: z.string().url().optional().nullable(),
  problem: z.string().optional().nullable(),
  solution: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  timeline: z.string().optional().nullable(),
  highlights: z.array(z.string()),
  categories: z.array(z.string()),
  featured: z.boolean().default(false)
});

export const ExperienceSchema = z.object({
  position: z.string(),
  company: z.string(),
  period: z.string(),
  location: z.string(),
  description: z.string(),
  responsibilities: z.array(z.string()),
  technologies: z.array(z.string())
});

export const CertificateSchema = z.object({
  certId: z.string(),
  title: z.string(),
  url: z.string(),
  type: z.string()
});
