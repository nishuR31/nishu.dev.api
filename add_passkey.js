const fs = require('fs');
const file = 'src/modules/auth/auth.controller.ts';
let code = fs.readFileSync(file, 'utf8');

const passkeyFuncs = `
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
          id: key.credentialID,
          type: 'public-key',
          transports: key.transports as any,
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
            credentialID: credential.id,
            credentialPublicKey: Buffer.from(credential.publicKey),
            counter: BigInt(credential.counter),
            transports: credential.transports || [],
          }
        });

        // Clear challenge
        await prisma.user.update({
          where: { id: user.id },
          data: { currentChallenge: null }
        });

        return sendSuccess(reply, "Passkey registered successfully", 200);
      }
      return sendError(reply, "Passkey not verified", 400);
    } catch (error: any) {
      return sendError(reply, "Failed to verify passkey", 500, error.message);
    }
  }
`;

code = code.replace(/}\s*$/s, passkeyFuncs + '\n}\n');
fs.writeFileSync(file, code);
