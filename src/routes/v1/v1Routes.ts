import Router from "./authRoutes";
import { FastifyPluginAsync } from "fastify";

const v1Router: FastifyPluginAsync = async (app: any) => {
  app.register(Router);
};

export default v1Router;
