import Fastify from "fastify";
import router from "../src/routes/index.js";
import cloudinary from "cloudinary";
import multipart from "@fastify/multipart";
const main = async () => {
  const port = 3000;
  const app = Fastify({
    logger: true,
  });
  app.register(multipart, {
    attachFieldsToBody: true,
    addToBody: true,
  });
  app.register(router, { prefix: "/api" });
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  app.listen({ port: port, host: "0.0.0.0" }, function (err, address) {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
  });
};

main();

/* images?.map((image, index) => {
  return {
    "link": image,
    "priority": index
  };
}), */
