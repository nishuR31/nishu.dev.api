import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import llmController from "./llm.controller";


export default async function llmRoutes(fastify: FastifyInstance) {

    fastify.get("/hello", llmController.hello);
    fastify.post("/ask", llmController.chat);
}