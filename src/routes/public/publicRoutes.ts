import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { health, ping, portfolio } from "../../controllers/authController";

const PublicRoutes: FastifyPluginAsync = async (app: any) => {
  app.get(
    "/health",
    {
      schema: {
        description: "Check server health",
        tags: ["health"],
      },
    },
    health,
  );

  app.get(
    "/ready",
    {
      schema: {
        description: "Check dependency readiness",
        tags: ["ready"],
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      // In Phase 2 this will check database connectivity.
      return (reply as any).status(200).send({ success: true, message: "Dependencies are ready" });
    }
  );

  app.get(
    "/ping",
    {
      schema: {
        description: "Pong",
        tags: ["ping"],
      },
    },
    ping,
  );

  app.get(
    "/portfolio",
    {
      schema: {
        description: "Get portfolio data",
        tags: ["portfolio"],
      },
    },
    portfolio,
  );
};

export default PublicRoutes;
