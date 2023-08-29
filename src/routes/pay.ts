import { FastifyPluginCallback } from "fastify";
import paymentController from "../controllers/pay.js";

const payRoute: FastifyPluginCallback = (fastify, options, done) => {
  fastify.post("/pay", async (req, res) => {
    const response = await paymentController.pay(req);
    res.send(response);
  });

  fastify.post("/payTest", async (req, res) => {
    const response = await paymentController.payTest(req);
    res.send(response);
  });
  done();
};

export { payRoute };
