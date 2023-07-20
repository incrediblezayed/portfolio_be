import { FastifyPluginCallback } from "fastify";
import { projectRoute } from "./projects.js";
import { experienceRoute } from "./experience.js";
import { contactRoute } from "./contact.js";
import { resumeRoute } from "./resume.js";
import { techStackRouter } from "./techStack.js";
import axios from "axios";
import crypto from "crypto";
import { url } from "inspector";

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
    console.log(`Base64 Payload: ${encoded}`);
    const saltKey = "cc2f75ad-01c2-4417-92f8-32964ce8d12d";
    const saltIndex = "1";
    const dataToEncode = encoded + "/pg/v1/pay" + saltKey;
    hash.update(dataToEncode);
    const hashValue = hash.digest("hex");
    console.log(`sha256 Value: ${hashValue}`);
    const headerVerification = hashValue + "###" + saltIndex;
    console.log(`Header Verification: ${headerVerification}`);
    const headers = {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-VERIFY": headerVerification,
    };
    try {
      const response = await axios.post(
        "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
        encoded,
        {
          headers: headers,
        }
      );
      reply.send(response);
    } catch (e) {
      console.log(e);
      reply.send(e);
    }
  });
  done();
};

export { defaultRouter };
