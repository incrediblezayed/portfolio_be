import { FastifyPluginCallback } from "fastify";
import projectController from "../controllers/projects.js";

const projectRoute: FastifyPluginCallback = (fastify, options, done) => {
  fastify.get("/", async (req, res) => {
    try {
      const projects = await projectController.getAllProjects();
      res.code(200).send(projects);
    } catch (e) {
      res.code(500).send(`Internal Server Error ${e}`);
    }
  });

  fastify.post("/", async (req, res) => {
    try {
      const success = await projectController.createProject(req.body);
      res.code(200).send(success);
    } catch (e) {
      console.error(e);
      res.code(500).send(`Internal Server Error ${e}`);
    }
  });

  fastify.get("/:id", async (req, res) => {
    try {
      const project = await projectController.getProjectById(
        (req.params as any).id
      );
      res.code(200).send(project);
    } catch (e) {
      res.code(500).send(`Internal Server Error ${e}`);
    }
  });

  fastify.delete("/:id", async (req, res) => {
    try {
      const success = await projectController.deleteProject(
        (req.params as any).id
      );
      res.code(200).send(success);
    } catch (e) {
      res.code(500).send(`Internal Server Error ${e}`);
    }
  });

  fastify.put("/:id", async (req, res) => {
    try {
      const updated = await projectController.updateProject((req.params as any).id, req.body);
      res.code(200).send(updated);
    } catch (e) {
      res.code(500).send(`Internal Server Error ${e}`);
    }
  });

  fastify.post("/uploadProjectImage/", async (req, res) => {
    try {
      const success = await projectController.uploadProjectImage(req.body);
      res.code(200).send(success);
    } catch (e) {
      res.code(500).send(`Internal Server Error ${e}`);
    }
  });

  done();
};

export { projectRoute };
