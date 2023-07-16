import { FastifyPluginCallback } from "fastify";
import projectRoute from "./projects.js";
import experienceRoute from "./experience.js";
import contactRoute from "./contact.js";

const fastifyRouter: FastifyPluginCallback = (fastify, options, done) => {
  fastify.register(projectRoute, { prefix: "/projects" });
  fastify.register(experienceRoute, { prefix: "/experiences" });
  fastify.register(contactRoute, { prefix: "/contact" })
  done();
};

export default fastifyRouter;
