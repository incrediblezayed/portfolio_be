import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function getAllExperience() {
    try {
        const experience = await prisma.workExperince.findMany({
            orderBy: {
                startDate: "desc",
            },
            include: {
                techStacks: true,
            },
        });
        return experience;
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}
async function addExperience(body) {
    try {
        console.log(body);
        const newExp = await prisma.workExperince.create({
            data: {
                company: body.company,
                position: body.position,
                startDate: body.startDate,
                endDate: body.endDate,
                website: body.website,
                location: body.location,
                achievements: body.achievements,
                techStacks: {
                    connect: body.techStacks.map((id) => ({ id: id })),
                },
            },
        });
        return `Successfully Created! Id: ${newExp.id}`;
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}
async function updateExperience(id, body) {
    try {
        const updatedExp = await prisma.workExperince.update({
            where: { id: id },
            data: {
                company: body.company,
                position: body.position,
                startDate: body.startDate,
                endDate: body.endDate,
                website: body.website,
                location: body.location,
                achievements: body.achievements,
                techStacks: {
                    connect: body.techStacks.map((id) => ({ id: id })),
                },
            },
        });
        return `Successfully Updated! Id: ${updatedExp.id}`;
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}
async function updateActive(id, isActive) {
    try {
        console.log(isActive);
        console.log(id);
        const updatedExp = await prisma.workExperince.update({
            where: { id: id },
            data: {
                isActive: isActive,
            },
        });
        return `Successfully Updated! Id: ${updatedExp.id}`;
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}
async function deleteExperience(id) {
    try {
        const deletedExp = await prisma.workExperince.delete({
            where: { id: id },
        });
        return `Successfully Deleted! Id: ${deletedExp.id}`;
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}
export default {
    getAllExperience,
    addExperience,
    updateExperience,
    updateActive,
    deleteExperience,
};
