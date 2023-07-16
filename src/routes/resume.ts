import { FastifyPluginCallback } from "fastify";
import resumeController from "../controllers/resume.js";

const resumeRoute: FastifyPluginCallback = (fastify, options, done) => {
  fastify.get("/", async (req, res) => {
    try {
      const resume = await resumeController.getResume();
      res.code(200).send(resume);
    } catch (e) {
      res.code(500).send(`Internal Server Error ${e}`);
    }
  });

  fastify.post("/", async (req, res) => {
    try {
      const resume = await resumeController.addResume((req.body as any).image);
      res.code(200).send(resume);
    } catch (e) {
      res.code(500).send(`Internal Server Error ${e}`);
    }
  });

  fastify.put("/:id", async (req, res) => {
    try {
      const resume = await resumeController.updateResume(
        (req.params as any).id,
        (req.body as any).image
      );
      res.code(200).send(resume);
    } catch (e) {
      res.code(500).send(`Internal Server Error ${e}`);
    }
  });

  done();
};

export { resumeRoute };
