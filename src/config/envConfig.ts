import dotenv from "dotenv";
dotenv.config();

type Environment = "development" | "test" | "production";

export const PORT: number = Number(process.env.PORT) || 3001;
export const NODE_ENV: Environment =
  (process.env.NODE_ENV as Environment) || "development";
export const BACKEND_URL: string = process.env.BACKEND_URL || "http://localhost:4000";

const normalizeHostname = (value: string): string => {
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return url.hostname;
  } catch {
    const host =
      value
        .trim()
        .replace(/^https?:\/\//, "")
        .split("/")[0] || "localhost";
    return host.split(":")[0] || "localhost";
  }
};

const derivedDomain = normalizeHostname(BACKEND_URL);
const configuredCookieDomain = process.env.COOKIE_DOMAIN?.trim();
const cookieDomain = configuredCookieDomain
  ? normalizeHostname(configuredCookieDomain)
  : derivedDomain;

export const GOOGLE_API_KEY: string = process.env.GOOGLE_API_KEY || "";
export const COOKIE_DOMAIN: string = cookieDomain;
export const RP_ID: string = process.env.RP_ID || derivedDomain;
export const FRONTEND_URL: string = process.env.FRONTEND_URL || "http://localhost:3000";
export const CORS_ORIGIN: string =
  process.env.CORS_ORIGIN ||
  "http://localhost:3000,http://localhost:5173,https://nishudevportfolio.vercel.app";

// Database & Cache
export const REDIS: string = process.env.REDIS || "";
export const DATABASE_URL: string = process.env.DATABASE_URL || "";
export const ADMIN_KEY:string=process.env.ADMIN_KEY||""
// Supabase Storage
export const SUPABASE_URL: string = process.env.SUPABASE_URL || "";
export const BUCKET_URL: string = process.env.BUCKET_URL || "";
export const SUPABASE_KEY: string =
  process.env.SUPABASE_SECRET ||
  // process.env.SUPABASE_SECRET_KEY ||
  // process.env.SUPABASE_SERVICE_ROLE_KEY ||
  // process.env.SUPABASE_PUBLISHABLE_KEY ||
  // process.env.SUPABASE_KEY ||
  "";
export const SUPABASE_ACCESS_KEY: string = process.env.SUPABASE_ACCESS_KEY || "";
export const BUCKET_CERTI: string = process.env.BUCKET_CERTI || "certificates";
export const BUCKET_PROJECT: string = process.env.BUCKET_PROJECT || "project";

// Authentication
const jwtSecret = process.env.JWT_SECRET || "";
const cookieSecret = process.env.COOKIE_SECRET || "";
if (NODE_ENV === "production" && (!jwtSecret || !cookieSecret)) {
  throw new Error("JWT_SECRET and COOKIE_SECRET must be configured in production.");
}
export const JWT_SECRET: string = jwtSecret || "development-only-jwt-secret";
export const COOKIE_SECRET: string = cookieSecret || "development-only-cookie-secret";
