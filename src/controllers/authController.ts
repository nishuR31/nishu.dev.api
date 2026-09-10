import { FastifyReply, FastifyRequest } from "fastify";
import config, { Config } from "../data";
import { sendSuccess } from "../utils/common/response";

export const portfolio = async (req: FastifyRequest, res: FastifyReply) => {
  const result: Config = config;
  sendSuccess(res, "Portfolio fetched successfully", 200, result);
};

export const health = async (req: FastifyRequest, res: FastifyReply) => {
  sendSuccess(res, "Server Healthy", 200, 200);
};

export const ping = async (req: FastifyRequest, res: FastifyReply) => {
  sendSuccess(res, "pong", 200, "pong");
};
