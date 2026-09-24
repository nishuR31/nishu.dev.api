import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"

import { sendSuccess } from "../../utils/common/response";


export default async function serverRoutes(fastify: FastifyInstance) {
    fastify.get("/health", health);
    fastify.get("/ping", ping);

    fastify.get("/", start);
}

export const health = async (req: FastifyRequest, res: FastifyReply) => {
    sendSuccess(res, "Server Healthy", 200, { uptime: process.uptime(), date: new Date().toLocaleString() });
};
export const start = async (req: FastifyRequest, res: FastifyReply) => {
    sendSuccess(res, "Server Started", 200, { uptime: process.uptime(), date: new Date().toLocaleString() });
}

export const ping = async (req: FastifyRequest, res: FastifyReply) => {
    sendSuccess(res, "pong", 200, "pong");
};
