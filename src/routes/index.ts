import { FastifyPluginCallback } from "fastify";
import projectRoute from "./projects.js";
import experienceRoute from "./experience.js";

const fastifyRouter: FastifyPluginCallback = (fastify, options, done) => {
  fastify.register(projectRoute, { prefix: "/projects" });
  fastify.register(experienceRoute, { prefix: "/experiences" });
  done();
};

export default fastifyRouter;
