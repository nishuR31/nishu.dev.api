import dotenv from "dotenv";
dotenv.config();

type Environment = "development" | "test" | "production";

export const PORT: number = Number(process.env.PORT) || 3001;
export const NODE_ENV: Environment =
  (process.env.NODE_ENV as Environment) || "development";
