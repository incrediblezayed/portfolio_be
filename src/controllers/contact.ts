import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


async function getEnquiries() {
    try {
        const enquiries = await prisma.enquiryModel.findMany(
            {
                orderBy: {
                    createdAt: 'desc'
                }
            }
        );
        return enquiries;
    } catch (e) {
        console.error(e);
        throw e;
    }
}

async function addEnquiry(body: any) {
    try {
        console.log(body);
        const newEnquiry = await prisma.enquiryModel.create({ data: body });
        return `Successfully Created! Id: ${newEnquiry.id}`;
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}

export default {
    getEnquiries,
    addEnquiry
}