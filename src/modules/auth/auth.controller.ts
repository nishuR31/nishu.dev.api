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
        const isValid2FA = authenticator.verify({ token: data.token2FA, secret: user.twoFactorSecret! });
        if (!isValid2FA) {
          return sendUnauthorizedError(reply, "Invalid 2FA token.");
        }
      }

      const token = await reply.jwtSign({ id: user.id, role: user.role, email: user.email });

      reply.setCookie("access_token", token, {
        path: "/",
        secure: NODE_ENV === "production",
        httpOnly: true,
        sameSite: NODE_ENV === "production" ? "none" : "lax",
      });

      return sendSuccess(reply, "Login successful", 200, { token });
    } catch (error) {
      return sendError(reply, "Login failed", 400, error);
    }
  }

  static async setup2FA(req: FastifyRequest, reply: FastifyReply) {
    const userPayload = req.user as { id: string; email: string };
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(userPayload.email, rpName, secret);
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

  static async generatePasskeyOptions(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string; email: string };
      const user = await prisma.user.findUnique({ where: { id: userPayload.id }, include: { passkeys: true } });
      if (!user) return sendError(reply, "User not found", 404);

      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: new Uint8Array(Buffer.from(user.id)),
        userName: user.email,
        excludeCredentials: user.passkeys.map(key => ({
          id: key.credentialID.toString("base64url"),
          type: 'public-key',
          transports: key.transports ? key.transports.split(",") as any : undefined,
        })),
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'preferred',
        }
      });

      // Save challenge in DB for this user temporarily
      await prisma.user.update({
        where: { id: user.id },
        data: { currentChallenge: options.challenge }
      });

      return sendSuccess(reply, "Registration options generated", 200, options);
    } catch (error: any) {
      return sendError(reply, "Failed to generate passkey options", 500, error.message);
    }
  }

  static async generatePasskeyAuthOptions(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as { email: string };
      const user = await prisma.user.findUnique({ where: { email: body.email }, include: { passkeys: true } });
      if (!user) return sendUnauthorizedError(reply, "User not found");

      if (user.passkeys.length === 0) {
        return sendError(reply, "No passkeys registered for this user", 400);
      }

      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: user.passkeys.map(key => ({
          id: key.credentialID.toString("base64url"),
          type: 'public-key',
          transports: key.transports ? key.transports.split(",") as any : undefined,
        })),
        userVerification: 'preferred',
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { currentChallenge: options.challenge }
      });

      return sendSuccess(reply, "Authentication options generated", 200, options);
    } catch (error: any) {
      return sendError(reply, "Failed to generate auth options", 500, error.message);
    }
  }

  static async verifyPasskeyRegistration(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const body = req.body as any;

      const user = await prisma.user.findUnique({ where: { id: userPayload.id } });
      if (!user || !user.currentChallenge) {
        return sendError(reply, "User or challenge not found", 400);
      }

      let verification;
      try {
        verification = await verifyRegistrationResponse({
          response: body,
          expectedChallenge: user.currentChallenge,
          expectedOrigin: origin,
          expectedRPID: rpID,
        });
      } catch (error: any) {
        return sendError(reply, "Verification failed", 400, error.message);
      }

      if (verification.verified && verification.registrationInfo) {
        const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

        await prisma.passkey.create({
          data: {
            userId: user.id,
            credentialID: Buffer.from(credential.id, "base64url"),
            credentialPublicKey: Buffer.from(credential.publicKey),
            counter: BigInt(credential.counter),
            transports: credential.transports?.join(",") || null,
          }
        });

        // Clear challenge
        await prisma.user.update({
          where: { id: user.id },
          data: { currentChallenge: null }
        });

        return sendSuccess(reply, "Passkey registered successfully", 200, null);
      }
      return sendError(reply, "Passkey not verified", 400);
    } catch (error: any) {
      return sendError(reply, "Failed to verify passkey", 500, error.message);
    }
  }

  static async verifyPasskeyAuthentication(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const email = body.email;
      const response = body.credential;

      const user = await prisma.user.findUnique({ where: { email }, include: { passkeys: true } });
      if (!user || !user.currentChallenge) {
        return sendError(reply, "User or challenge not found", 400);
      }

      const passkey = user.passkeys.find(k => k.credentialID.toString("base64url") === response.id);
      if (!passkey) {
        return sendError(reply, "Passkey not found", 404);
      }

      let verification;
      try {
        verification = await verifyAuthenticationResponse({
          response,
          expectedChallenge: user.currentChallenge,
          expectedOrigin: origin,
          expectedRPID: rpID,
          authenticator: {
            credentialID: passkey.credentialID,
            credentialPublicKey: passkey.credentialPublicKey,
            counter: Number(passkey.counter),
          }
        });
      } catch (error: any) {
        return sendError(reply, "Verification failed", 400, error.message);
      }

      if (verification.verified) {
        await prisma.passkey.update({
          where: { id: passkey.id },
          data: { counter: BigInt(verification.authenticationInfo.newCounter) }
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { currentChallenge: null }
        });

        const token = await reply.jwtSign({ id: user.id, role: user.role, email: user.email });

        reply.setCookie("access_token", token, {
          path: "/",
          secure: NODE_ENV === "production",
          httpOnly: true,
          sameSite: NODE_ENV === "production" ? "none" : "lax",
        });

        return sendSuccess(reply, "Passkey login successful", 200, { token });
      }
      return sendError(reply, "Passkey not verified", 400);
    } catch (error: any) {
      return sendError(reply, "Failed to verify passkey login", 500, error.message);
    }
  }

}
