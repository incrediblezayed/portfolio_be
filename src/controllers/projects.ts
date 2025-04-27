import { PrismaClient, Project } from "@prisma/client";
import { UploadApiResponse, v2 } from "cloudinary";
const prisma = new PrismaClient();

async function getAllProjects(): Promise<Project[]> {
  try {
    const projects = await prisma.project.findMany({
      orderBy: [
        {
          endDate: "desc",
        },
      ],
    });
    return projects;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function getProjectById(id: string): Promise<Project | null> {
  try {
    const project = await prisma.project.findUnique({
      where: {
        id: id,
      },
    });
    return project;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function createProject(body: any): Promise<string> {
  try {
    console.log(body);
    const image = body.image[0];
    console.log(image);
    const otherImages = body.otherImages;
    console.log(otherImages);
    body.image = "";
    body.otherImages = [];
    console.log(body);
    const techStacks = body.techStacks;
    delete body.techStacks;
    const response = await prisma.project.create({ data: body });

    const otherImageUrl = [];
    if (image) {
      var upload: UploadApiResponse = await new Promise((resolve, reject) => {
        v2.uploader
          .upload_stream(
            {
              folder: `projects/${response.id}`,
            },
            (error, result) => {
              if (result) {
                resolve(result);
              } else {
                reject(error);
              }
            }
          )
          .end(image.data);
      });
      if (upload.error) throw new Error("Error uploading banner image");
      if (otherImages) {
        for (const otherImage of otherImages) {
          var otherUpload: UploadApiResponse = await new Promise(
            (resolve, reject) => {
              v2.uploader
                .upload_stream(
                  {
                    folder: `projects/${response.id}/otherImages`,
                  },
                  (error, result) => {
                    if (result) {
                      resolve(result);
                    } else {
                      reject(error);
                    }
                  }
                )
                .end(otherImage.data);
            }
          );
          if (otherUpload.error) throw new Error("Error uploading other image");
          otherImageUrl.push(otherUpload.secure_url);
        }
      }
      await prisma.project.update({
        where: { id: response.id },
        data: {
          image: upload.secure_url,
          otherImages: otherImageUrl,
          techStacks: {
            connect: techStacks.map((id: string) => ({ id: id })),
          },
        },
      });
    }
    return response.id;
  } catch (e) {
    throw e;
  }
}

async function deleteProject(id: string): Promise<string> {
  try {
    const response = await prisma.project.delete({
      where: {
        id: id,
      },
    });
    return `${response}`;
  } catch (e) {
    throw e;
  }
}

async function uploadProjectImage(body: any): Promise<string> {
  try {
    console.log(body.image[0].filename);

    //const stream = await v2.uploader.upload(fileData.path);
    //console.log(stream); 
    return ``;
  } catch (e) {
    throw e;
  }
}

async function updateProject(id: string, body: any): Promise<string> {
  try {
    const updateData: any = { ...body };
    let imageUrl = body.image;
    let otherImageUrls = body.otherImages;
    const techStacks = body.techStacks;
    delete updateData.techStacks;
    delete updateData.image;
    delete updateData.otherImages;

    // Handle image upload if new image data is provided
    if (body.image && body.image[0] && body.image[0].data) {
      const upload: UploadApiResponse = await new Promise((resolve, reject) => {
        v2.uploader.upload_stream(
          { folder: `projects/${id}` },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        ).end(body.image[0].data);
      });
      if (upload.error) throw new Error("Error uploading banner image");
      imageUrl = upload.secure_url;
    }

    // Handle otherImages upload if new image data is provided
    if (Array.isArray(body.otherImages) && body.otherImages.length > 0 && body.otherImages[0].data) {
      otherImageUrls = [];
      for (const otherImage of body.otherImages) {
        const otherUpload: UploadApiResponse = await new Promise((resolve, reject) => {
          v2.uploader.upload_stream(
            { folder: `projects/${id}/otherImages` },
            (error, result) => {
              if (result) {
                resolve(result);
              } else {
                reject(error);
              }
            }
          ).end(otherImage.data);
        });
        if (otherUpload.error) throw new Error("Error uploading other image");
        otherImageUrls.push(otherUpload.secure_url);
      }
    }

    // Prepare update object
    if (imageUrl) updateData.image = imageUrl;
    if (otherImageUrls) updateData.otherImages = otherImageUrls;
    if (techStacks) {
      updateData.techStacks = {
        set: [], // disconnect all first
        connect: techStacks.map((id: string) => ({ id })),
      };
    }

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
    });
    return updated.id;
  } catch (e) {
    throw e;
  }
}

export default {
  getAllProjects,
  getProjectById,
  createProject,
  deleteProject,
  uploadProjectImage,
  updateProject,
};
