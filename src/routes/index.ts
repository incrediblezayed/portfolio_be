import { FastifyPluginCallback } from "fastify";
import { projectRoute } from "./projects.js";
import { experienceRoute } from "./experience.js";
import { contactRoute } from "./contact.js";
import { resumeRoute } from "./resume.js";
import { techStackRouter } from "./techStack.js";
import { payRoute } from "./pay.js";
import { profileDataRoute } from './profileData.js';
import { url } from "inspector";
import { PrismaClient } from "@prisma/client";

const defaultRouter: FastifyPluginCallback = (fastify, options, done) => {
  fastify.get("/", async (request, reply) => {
    return { hello: "world" };
  });

  fastify.register(projectRoute, { prefix: "/projects" });
  fastify.register(experienceRoute, { prefix: "/experiences" });
  fastify.register(contactRoute, { prefix: "/contact" });
  fastify.register(resumeRoute, { prefix: "/resume" });
  fastify.register(techStackRouter, { prefix: "/techStacks" });
  fastify.register(payRoute, { prefix: "/phonePe" });
  fastify.register(profileDataRoute, { prefix: '/profile' });

  done();
};

export { defaultRouter };
