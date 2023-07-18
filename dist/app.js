import Fastify from "fastify";
import { defaultRouter } from "../src/routes/index.js";
import cloudinary from "cloudinary";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
const main = async () => {
    let PORT = 3000;
    if (process.env.PORT) {
        PORT = parseInt(process.env.PORT);
    }
    else {
        console.log("process.env.PORT not found");
    }
    const app = Fastify({
        logger: true,
    });
    app.register(cors, {
        origin: "*",
    });
    app.register(multipart, {
        attachFieldsToBody: true,
        addToBody: true,
    });
    app.register(defaultRouter, { prefix: "/api" });
    cloudinary.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    app.listen({ port: PORT, host: "0.0.0.0" }, function (err, address) {
        if (err) {
            app.log.error(err);
            process.exit(1);
        }
    });
};
main();
