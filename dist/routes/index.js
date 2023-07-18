import { projectRoute } from "./projects.js";
import { experienceRoute } from "./experience.js";
import { contactRoute } from "./contact.js";
import { resumeRoute } from "./resume.js";
import { techStackRouter } from "./techStack.js";
const defaultRouter = (fastify, options, done) => {
    fastify.register(projectRoute, { prefix: "/projects" });
    fastify.register(experienceRoute, { prefix: "/experiences" });
    fastify.register(contactRoute, { prefix: "/contact" });
    fastify.register(resumeRoute, { prefix: "/resume" });
    fastify.register(techStackRouter, { prefix: "/techStacks" });
    done();
};
export { defaultRouter };
