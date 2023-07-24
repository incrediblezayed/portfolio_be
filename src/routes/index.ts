import { FastifyPluginCallback } from "fastify";
import { projectRoute } from "./projects.js";
import { experienceRoute } from "./experience.js";
import { contactRoute } from "./contact.js";
import { resumeRoute } from "./resume.js";
import { techStackRouter } from "./techStack.js";
import axios from "axios";
import crypto from "crypto";
import { url } from "inspector";
import { PrismaClient } from "@prisma/client";

const defaultRouter: FastifyPluginCallback = (fastify, options, done) => {
  fastify.register(projectRoute, { prefix: "/projects" });
  fastify.register(experienceRoute, { prefix: "/experiences" });
  fastify.register(contactRoute, { prefix: "/contact" });
  fastify.register(resumeRoute, { prefix: "/resume" });
  fastify.register(techStackRouter, { prefix: "/techStacks" });

  fastify.post("/pay/", async (request, reply) => {
    var hash = crypto.createHash("sha256");
    const json = JSON.stringify(request.body);
    const encoded = Buffer.from(json).toString("base64");
    const saltKey = process.env.SALT_KEY as string;
    const saltIndex = "1";
    const dataToEncode = encoded + "/pg/v1/pay" + saltKey;
    hash.update(dataToEncode);
    const hashValue = hash.digest("hex");
    const headerVerification = hashValue + "###" + saltIndex;

    const requestBody = {
      request: encoded,
    };

    const headers = {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-Verify": headerVerification,
    };
    try {
      const response = await axios.post(
        process.env.PHONEPE_URL as string,
        requestBody,
        {
          headers: headers,
        }
      );
      reply.send(response.data);
    } catch (e) {
      console.log("Api Error", e);
      reply.send(e);
    }
  });
  fastify.post("/addJob/", async (request, reply) => {
    const job = request.body;
    const response = await new PrismaClient().jobModel.create({
      data: job as any,
    });
    console.log("response", response);
    reply.send(response);
  });

  fastify.get("/getJobs/", async (request, reply) => {
    const response = await new PrismaClient().jobModel.findMany();
    console.log("response", response);
    reply.send(response);
  });

  fastify.post("/phonePeTest/", async (request, reply) => {
    const body = request.body;
    console.log("body", body);
    await new PrismaClient().phonePeResponse.create({
      data: {
        data: body as any,
      },
    });
    reply.send(body);
  });

  done();
};

export { defaultRouter };
