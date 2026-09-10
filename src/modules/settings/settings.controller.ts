import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../../providers/db.provider";
import { z } from "zod";
import { PortfolioController } from "../portfolio/portfolio.controller";

const SettingsSchema = z.object({
  maintenanceMode: z.boolean(),
  siteName: z.string().optional(),
});

export class SettingsController {
  static async getSettings(req: FastifyRequest, reply: FastifyReply) {
    try {
      const portfolio = await prisma.portfolioData.findFirst();
      if (!portfolio) {
        return reply.send({
          success: true,
          statusCode: 200,
          data: { maintenanceMode: false, siteName: "nishudevportfolio" },
        });
      }
      return reply.send({
        success: true,
        statusCode: 200,
        data: {
          maintenanceMode: portfolio.maintenanceMode,
          siteName: portfolio.siteName,
        },
      });
    } catch (error: any) {
      return reply
        .code(500)
        .send({ success: false, statusCode: 500, message: "Internal server error" });
    }
  }

  static async updateSettings(
    req: FastifyRequest<{ Body: { maintenanceMode?: boolean; siteName?: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const portfolio = await prisma.portfolioData.findFirst();
      if (!portfolio) {
        return reply.code(404).send({ success: false, message: "Portfolio not found" });
      }
      const parsedData = SettingsSchema.parse(req.body);

      const updated = await prisma.portfolioData.update({
        where: { id: portfolio.id },
        data: {
          maintenanceMode: parsedData.maintenanceMode,
          siteName: parsedData.siteName,
        },
      });

      // Update portfolio cache
      await PortfolioController.invalidateCache(req);

      return reply.send({
        success: true,
        statusCode: 200,
        message: "Settings updated",
        data: { maintenanceMode: updated.maintenanceMode, siteName: updated.siteName },
      });
    } catch (error: any) {
      console.error(error);
      return reply
        .code(500)
        .send({ success: false, statusCode: 500, message: "Internal server error" });
    }
  }
}
