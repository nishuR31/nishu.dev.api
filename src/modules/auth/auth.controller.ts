import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../../providers/db.provider";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import { RegisterSchema, LoginSchema } from "./auth.schema";
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import { sendSuccess, sendError, sendUnauthorizedError } from "../../utils/common/response";
import { NODE_ENV, COOKIE_DOMAIN, RP_ID, FRONTEND_URL } from "../../config/envConfig";

const rpName = "Nishu Dev CRM";
const rpID = RP_ID;
const origin = FRONTEND_URL;

export class AuthController {
  
  static async register(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = RegisterSchema.parse(req.body);
      
      // Enforce ONLY one user (the Developer)
      const existingUserCount = await prisma.user.count();
      if (existingUserCount > 0) {
        return sendError(reply, "Registration locked: Developer already exists.", 403);
      }

      const passwordHash = await bcrypt.hash(data.password, 10);

      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: "developer"
        }
      });

      return sendSuccess(reply, "Developer registered successfully.", 200, { id: user.id, email: user.email });
    } catch (error) {
      return sendError(reply, "Registration failed", 400, error);
    }
  }

  static async login(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = LoginSchema.parse(req.body);
      
      const user = await prisma.user.findUnique({ where: { email: data.email } });
      if (!user || !user.passwordHash) {
        return sendUnauthorizedError(reply, "Invalid credentials.");
      }

      const isValid = await bcrypt.compare(data.password, user.passwordHash);
      if (!isValid) {
        return sendUnauthorizedError(reply, "Invalid credentials.");
      }

      if (user.is2FAEnabled) {
        if (!data.token2FA) {
          return sendUnauthorizedError(reply, "2FA token required.");
        }
        const isValid2FA = authenticator.authenticator.verify({ token: data.token2FA, secret: user.twoFactorSecret! });
        if (!isValid2FA) {
          return sendUnauthorizedError(reply, "Invalid 2FA token.");
        }
      }

      const token = await reply.jwtSign({ id: user.id, role: user.role, email: user.email });

      reply.setCookie("access_token", token, {
        domain: COOKIE_DOMAIN,
        path: "/",
        secure: NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict",
      });

      return sendSuccess(reply, "Login successful", 200, { token });
    } catch (error) {
      return sendError(reply, "Login failed", 400, error);
    }
  }

  static async setup2FA(req: FastifyRequest, reply: FastifyReply) {
    const userPayload = req.user as { id: string; email: string };
    const secret = authenticator.authenticator.generateSecret();
    const otpauth = authenticator.authenticator.keyuri(userPayload.email, rpName, secret);
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    await prisma.user.update({
      where: { id: userPayload.id },
      data: { twoFactorSecret: secret, is2FAEnabled: true }
    });

    return sendSuccess(reply, "2FA Setup Initialized", 200, { qrCodeUrl, secret });
  }

  static async logout(req: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie("access_token", { path: "/" });
    return sendSuccess(reply, "Logged out successfully", 200, null);
  }

  static async me(req: FastifyRequest, reply: FastifyReply) {
    // req.user is populated by the authorizeDeveloper preValidation hook
    return sendSuccess(reply, "Authenticated", 200, req.user);
  }
}
