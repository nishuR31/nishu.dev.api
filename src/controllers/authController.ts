import { FastifyReply, FastifyRequest } from "fastify";
import config, { Config } from "../data";
import asyncHandler from "../utils/common/asyncHandler";
import { sendSuccess } from "../utils/common/response";

export const portfolio = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply): Promise<any> => {
    // console.log(req)
    const result: Config = config;

    sendSuccess(res, "Portfolio fetched successfully", 200, result);
  },
);

export const health = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply): Promise<any> => {
    const result: number = 200;

    sendSuccess(res, "Server Healthy", result, result);
  },
);

export const ping = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply): Promise<any> => {
    const result: string = "pong";

    sendSuccess(res, "pong", 200, result);
  },
);
