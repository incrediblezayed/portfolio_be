import { FastifyPluginCallback } from "fastify";
import contactController from "../controllers/contact.js";

const contactRoute: FastifyPluginCallback = (fastify, options, done) => {
  fastify.get("/", async (req, res) => {
    try {
      const enquiries = await contactController.getEnquiries();
      res.code(200).send(enquiries);
    } catch (e) {
      res.code(500).send(`Internal Server Error ${e}`);
    }
  });
  fastify.post("/", async (req, res) => {
    try {
      if (!req.body) {
        throw "Request body cannot be empty";
      }
      const response = await contactController.addEnquiry(req.body);
      res.status(201).send(response);
    } catch (error) {
      res.code(500).send(error);
    }
  });
  done();
};

export { contactRoute };
