import { PrismaClient } from "@prisma/client";
import { v2 } from "cloudinary";
const prisma = new PrismaClient();
async function createTechStack(body) {
    try {
        const image = body.image[0].data;
        const upload = await new Promise((resolve, reject) => {
            v2.uploader
                .upload_stream({ folder: "techStacks" }, (error, result) => {
                if (result) {
                    resolve(result);
                }
                else {
                    reject(error);
                }
            })
                .end(image);
        });
        if (upload.error)
            throw new Error("Error uploading banner image");
        body.image = upload.secure_url;
        const response = await prisma.techStack.create({ data: body });
        return response;
    }
    catch (e) {
        throw e;
    }
}
async function getTechStack() {
    try {
        const techStack = await prisma.techStack.findMany();
        return techStack;
    }
    catch (error) {
        throw error;
    }
}
async function getTechStackById(id) {
    try {
        const techStack = await prisma.techStack.findUnique({
            where: {
                id: id,
            },
        });
        return techStack;
    }
    catch (error) {
        throw error;
    }
}
async function updateTechStack(id, body) {
    try {
        const image = body.image[0].data;
        if (image) {
            const upload = await new Promise((resolve, reject) => {
                v2.uploader
                    .upload_stream({ folder: "techStacks" }, (error, result) => {
                    if (result) {
                        resolve(result);
                    }
                    else {
                        reject(error);
                    }
                })
                    .end(image);
            });
            if (upload.error)
                throw new Error("Error uploading banner image");
            body.image = upload.secure_url;
        }
        const techStack = await prisma.techStack.update({
            where: {
                id: id,
            },
            data: body,
        });
        return techStack;
    }
    catch (error) {
        throw error;
    }
}
async function deleteTechStack(id) {
    try {
        await prisma.techStack.delete({
            where: {
                id: id,
            },
        });
    }
    catch (error) {
        throw error;
    }
}
export default {
    createTechStack,
    getTechStack,
    getTechStackById,
    updateTechStack,
    deleteTechStack,
};
