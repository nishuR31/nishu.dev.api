import { FastifyReply, FastifyRequest } from "fastify";
import llm from "./index";
import { sendSuccess, sendError } from "../../utils/common/response";

const llmController = {
    hello: async (req: FastifyRequest, res: FastifyReply) => {
        try {
            return sendSuccess(res, "Hello from the LLM assistant!", 200, {
                message: "I am ready to answer questions about Nishan's portfolio."
            });
        } catch (error) {
            return sendError(res, "Something went wrong", 500);
        }
    },

    chat: async (req: FastifyRequest<{ Body: { question: string } }>, res: FastifyReply) => {
        try {
            const { question } = req.body;
            if (!question) {
                return sendError(res, "Question is required in the request body.", 400);
            }

            const answer = await llm(question);
            
            if (!answer) {
                return sendError(res, "Could not generate an answer.", 500);
            }

            return sendSuccess(res, "Answer retrieved successfully", 200, { answer });
        } catch (error) {
            console.error(error);
            return sendError(res, "Failed to get answer from AI", 500);
        }
    }
};

export default llmController;