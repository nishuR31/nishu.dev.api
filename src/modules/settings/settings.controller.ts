import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../../providers/db.provider";
import { z } from "zod";
import { PortfolioController } from "../portfolio/portfolio.controller";

const SettingsSchema = z.object({
  maintenanceMode: z.boolean(),
  siteName: z.string().optional()
});

export class SettingsController {
  static async getSettings(req: FastifyRequest, reply: FastifyReply) {
    try {
      let settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
      
      if (!settings) {
        settings = await prisma.systemSettings.create({
          data: { id: "global", maintenanceMode: false, siteName: "nishu.dev" }
        });
      }

      return reply.send({ success: true, statusCode: 200, message: "Settings fetched", data: settings });
    } catch (error) {
      return reply.code(500).send({ success: false, statusCode: 500, message: "Failed to fetch settings", errors: error });
    }
  }

  static async updateSettings(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = SettingsSchema.parse(req.body);

      const updated = await prisma.systemSettings.upsert({
        where: { id: "global" },
        update: data,
        create: { id: "global", ...data }
      });

      await PortfolioController.invalidateCache(req.server.redis);

      return reply.send({ success: true, statusCode: 200, message: "Settings updated", data: updated });
    } catch (error) {
      return reply.code(400).send({ success: false, statusCode: 400, message: "Failed to update settings", errors: error });
    }
  }
}
