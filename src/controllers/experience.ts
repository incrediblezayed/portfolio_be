import { WorkExperince } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function getAllExperience(): Promise<WorkExperince[]> {
  try {
    const experience = await prisma.workExperince.findMany();
    return experience;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function addExperience(body: any): Promise<string> {
  try {
    const newExp = await prisma.workExperince.create(body);
    return `Successfully Created! Id: ${newExp.id}`;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function updateExperience(id: string, body: any): Promise<string> {
  try {
    const updatedExp = await prisma.workExperince.update({
      where: { id: id },
      data: body
    });
    return `Successfully Updated! Id: ${updatedExp.id}`;
  } catch (e) {
    console.error(e);
    throw e;
  }
}


async function deleteExperience(id: string): Promise<string> {
  try {
    const deletedExp = await prisma.workExperince.delete({
      where: { id: id }
    });
    return `Successfully Deleted! Id: ${deletedExp.id}`;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export default {
  getAllExperience,
  addExperience,
  updateExperience,
  deleteExperience
};
