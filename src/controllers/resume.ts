import { PrismaClient } from "@prisma/client";
import { UploadApiResponse, v2 } from "cloudinary";

const prisma = new PrismaClient();

async function getResume() {
  try {
    const resume = await prisma.resume.findFirst();
    return resume?.resume;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function addResume(image: any) {
  try {
    console.log(image[0].data);
    var upload: UploadApiResponse = await new Promise((resolve, reject) => {
      v2.uploader
        .upload_stream(
          {
            folder: `resume`,
            filename_override: "resume",
            public_id: "resume",
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        )
        .end(image[0].data);
    });
    if (upload.error) throw new Error("Error uploading resume");
    const addResume = await prisma.resume.create({
      data: {
        resume: upload.secure_url,
      },
    });
    return addResume.resume;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function updateResume(id: string, image: any) {
  try {
    console.log(image[0].data);
    await v2.api.delete_resources(["resume"]);
    var upload: UploadApiResponse = await new Promise((resolve, reject) => {
      v2.uploader
        .upload_stream(
          {
            folder: `resume`,
            filename_override: "resume",
            public_id: "resume",
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        )
        .end(image[0].data);
    });
    if (upload.error) throw new Error("Error uploading resume");
    const updateResume = await prisma.resume.update({
      where: { id: id },
      data: {
        resume: upload.secure_url,
      },
    });
    return updateResume.resume;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export default { getResume, addResume, updateResume };
