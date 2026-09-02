import { z } from "zod";

export const DeveloperSchema = z.object({
  name: z.string(),
  shortName: z.string(),
  role: z.string(),
  tagline: z.string(),
  bio: z.string(),
  location: z.string(),
  email: z.string().email(),
  about: z.array(z.string()),
});

export const SocialSchema = z.object({
  email: z.string().email(),
  github: z.string(),
  discord: z.string(),
  linkedin: z.string(),
  leetcode: z.string(),
  hackerone: z.string(),
  twitter: z.string(),
});

export const NavItemSchema = z.object({
  href: z.string(),
  label: z.string(),
});

export const ProjectSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  image: z.string(),
  technologies: z.array(z.string()),
  github: z.string(),
  demo: z.string().nullable().optional(),
  problem: z.string().optional(),
  solution: z.string().optional(),
  role: z.string().optional(),
  timeline: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
});

export const SubSkillSchema = z.object({
  name: z.string(),
  level: z.string(),
  hot: z.boolean().optional(),
});

export const SkillCategorySchema = z.object({
  title: z.string(),
  iconKey: z.string(),
  description: z.string(),
  bgClass: z.string(),
  iconClass: z.string(),
  skills: z.array(SubSkillSchema),
});

export const ExperienceSchema = z.object({
  position: z.string(),
  company: z.string(),
  period: z.string(),
  location: z.string().optional(),
  description: z.string().optional(),
  responsibilities: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
});

export const ContactInfoSchema = z.object({
  iconKey: z.string(),
  label: z.string(),
  value: z.string(),
  link: z.string().nullable(),
});

export const CertificateSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  type: z.enum(["pdf", "image"]),
});

export const CVSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  description: z.string(),
  lastUpdated: z.string().optional(),
});

export const PortfolioSchema = z.object({
  developer: DeveloperSchema,
  featuredProjects: z.array(z.string()),
  social: SocialSchema,
  NAV_ITEMS: z.array(NavItemSchema),
  recentTracks: z.boolean(),
  projects: z.array(ProjectSchema),
  skills: z.array(SkillCategorySchema),
  experiences: z.array(ExperienceSchema),
  contactInfo: z.array(ContactInfoSchema),
  certificates: z.array(CertificateSchema),
  cvs: z.array(CVSchema).optional(),
  additionalProjects: z.array(z.string()),
  strengths: z.array(z.string()),
});

export type Developer = z.infer<typeof DeveloperSchema>;
export type Social = z.infer<typeof SocialSchema>;
export type NavItem = z.infer<typeof NavItemSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type SkillCategory = z.infer<typeof SkillCategorySchema>;
export type SubSkill = z.infer<typeof SubSkillSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type Certificate = z.infer<typeof CertificateSchema>;
export type CV = z.infer<typeof CVSchema>;
export type Portfolio = z.infer<typeof PortfolioSchema>;
