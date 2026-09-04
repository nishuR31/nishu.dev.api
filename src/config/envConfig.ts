import dotenv from "dotenv";
dotenv.config();

type Environment = "development" | "test" | "production";

export const PORT: number = Number(process.env.PORT) || 3001;
export const NODE_ENV: Environment =
  (process.env.NODE_ENV as Environment) || "development";
export const BACKEND_URL: string = process.env.BACKEND_URL || "http://localhost:4000";

// Try to safely parse the BACKEND_URL to derive domain defaults
let derivedDomain = "localhost";
try {
  let safeUrl = BACKEND_URL;
  if (!safeUrl.startsWith("http://") && !safeUrl.startsWith("https://")) {
    safeUrl = "https://" + safeUrl;
  }
  derivedDomain = new URL(safeUrl).hostname;
} catch (e) {
  console.warn("Invalid BACKEND_URL provided, defaulting derived domains to localhost");
}

export const COOKIE_DOMAIN: string = process.env.COOKIE_DOMAIN || derivedDomain;
export const RP_ID: string = process.env.RP_ID || derivedDomain;
export const FRONTEND_URL: string = process.env.FRONTEND_URL || "http://localhost:3000";
export const CORS_ORIGIN: string = process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:5173,https://nishudevportfolio.vercel.app";

// Database & Cache
export const REDIS: string = process.env.REDIS || "";
export const DATABASE_URL: string = process.env.DATABASE_URL || "";

// Supabase Storage
export const SUPABASE_URL: string = process.env.SUPABASE_URL || "";
export const BUCKET_URL: string = process.env.BUCKET_URL || "";
export const BUCKET: string = process.env.BUCKET || "certificates";
export const SUPABASE_KEY: string = process.env.SUPABASE_KEY || "";
export const SUPABASE_ACCESS_KEY: string = process.env.SUPABASE_ACCESS_KEY || "";

// Authentication
export const JWT_SECRET: string = process.env.JWT_SECRET || "your-super-secret-jwt-key";
export const COOKIE_SECRET: string = process.env.COOKIE_SECRET || "super-secret-cookie-key";
