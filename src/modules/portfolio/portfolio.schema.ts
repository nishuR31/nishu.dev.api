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
  showAbout: z.boolean().default(true),
  showSkills: z.boolean().default(true),
  showExperience: z.boolean().default(true),
  showProjects: z.boolean().default(true),
  showEducation: z.boolean().default(true),
  showCertificates: z.boolean().default(true),
  showServices: z.boolean().default(true),
  showTestimonials: z.boolean().default(true),
});

export const ProjectSchema = z.object({
  slug: z.string().optional().nullable(),
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
  featured: z.boolean().default(false),
  status: z.string().optional().nullable(),
  architecture: z.array(z.string()).optional(),
  company: z.string().optional().nullable(),
  stars: z.number().int().optional().nullable(),
  visible: z.boolean().default(true).optional(),
});

export const ExperienceSchema = z.object({
  position: z.string(),
  company: z.string(),
  companyUrl: z.string().url().optional().nullable(),
  companyLogo: z.string().url().optional().nullable(),
  period: z.string(),
  isCurrent: z.boolean().default(false),
  location: z.string(),
  description: z.string(),
  responsibilities: z.array(z.string()),
  technologies: z.array(z.string()),
  visible: z.boolean().default(true).optional(),
});

export const CertificateSchema = z.object({
  certId: z.string(),
  title: z.string(),
  url: z.string(),
  type: z.string(),
  category: z.string().default("Other").optional(),
  issuer: z.string().optional().nullable(),
  issueDate: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
  visible: z.boolean().default(true).optional(),
});

export const ServiceSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string().optional().nullable(),
  pricing: z.string().optional().nullable(),
  visible: z.boolean().default(true).optional(),
});

export const TestimonialSchema = z.object({
  authorName: z.string(),
  authorRole: z.string(),
  authorCompany: z.string().optional().nullable(),
  content: z.string(),
  avatarUrl: z.string().optional().nullable(),
  visible: z.boolean().default(true).optional(),
});

export const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  visible: z.boolean().default(true).optional(),
});

export const SkillSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  level: z.string(),
  hot: z.boolean().default(false),
  yearsOfExperience: z.number().int().optional().nullable(),
});

export const SkillCategorySchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  iconKey: z.string(),
  description: z.string(),
  bgClass: z.string(),
  iconClass: z.string(),
  skills: z.array(SkillSchema).default([]),
});

export const SocialSchema = z.object({
  id: z.string().optional(),
  email: z.string().email().optional().nullable(),
  github: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  discord: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  leetcode: z.string().optional().nullable(),
  hackerone: z.string().optional().nullable(),
  githubFollowers: z.number().int().optional().nullable(),
  githubRepos: z.number().int().optional().nullable(),
  leetcodeSolved: z.number().int().optional().nullable(),
  leetcodeRanking: z.number().int().optional().nullable(),
});
