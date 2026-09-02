import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  token2FA: z.string().optional(),
});

export const WebAuthnVerifyRegistrationSchema = z.object({
  email: z.string().email(),
  credential: z.any(),
});

export const WebAuthnVerifyAuthenticationSchema = z.object({
  email: z.string().email(),
  credential: z.any(),
});
