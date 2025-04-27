import { PrismaClient, Prisma } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
const prisma = new PrismaClient();
// Create ProfileData (Refactored)
export const createProfileData = async (request, reply) => {
    try {
        // 1. Extract data from request
        const body = request.body;
        console.log(body.image[0]);
        const imageFile = body.image;
        console.log(imageFile);
        console.log(imageFile?.data);
        delete body.image;
        // 2. Check if image exists
        if (!imageFile) {
            // Uncomment if image is required
            reply.status(400).send({ error: 'Profile image is required.' });
            return;
        }
        // 3. Parse socialLinks first (fail early if there's an issue)
        let socialLinks;
        try {
            socialLinks = typeof body.socialLinks === 'string'
                ? JSON.parse(body.socialLinks)
                : body.socialLinks;
        }
        catch (parseError) {
            console.error('Error parsing socialLinks:', parseError);
            reply.status(400).send({ error: 'Invalid format for socialLinks' });
            return;
        }
        // 4. Upload image to Cloudinary
        console.log('Uploading Image');
        let uploadResult;
        try {
            uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({ folder: `profile/${Date.now()}` }, (error, result) => {
                    console.log(result, error);
                    if (result) {
                        resolve(result);
                    }
                    else {
                        reject(error || new Error('Cloudinary upload failed'));
                    }
                });
                uploadStream.end(imageFile.data);
            });
            console.log(uploadResult);
        }
        catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            reply.status(500).send({
                error: 'Failed to upload profile image',
                details: uploadError.message
            });
            return;
        }
        // 5. Create database record with image URL
        const prismaData = {
            ...body,
            socialLinks,
            image: uploadResult.url // Use the URL from Cloudinary
        };
        const createdProfileData = await prisma.profileData.create({
            data: prismaData,
        });
        if (!createdProfileData) {
            throw new Error('Profile data creation failed unexpectedly.');
        }
        // 6. Return successful response
        reply.status(201).send(createdProfileData);
    }
    catch (error) {
        console.error('Create Profile Data Error:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                reply.status(409).send({ error: 'Profile data conflict', details: 'A profile record might already exist or violates constraints.' });
                return;
            }
        }
        reply.status(500).send({ error: 'Failed to create profile data', details: error.message });
    }
};
// Get all ProfileData
export const getProfileData = async (request, reply) => {
    try {
        const profileData = await prisma.profileData.findFirst();
        if (profileData) {
            reply.status(200).send(profileData);
        }
        else {
            reply.status(404).send({ message: 'Profile data not found' });
        }
    }
    catch (error) {
        reply.status(500).send({ error: 'Failed to retrieve profile data', details: error.message });
    }
};
export const updateProfileData = async (request, reply) => {
    const { id } = request.params;
    let updatedProfileData = null;
    try {
        const body = request.body;
        const imageFile = body.image[0];
        let updateData = { ...body };
        if (updateData.socialLinks && typeof updateData.socialLinks === 'string') {
            try {
                updateData.socialLinks = JSON.parse(updateData.socialLinks);
            }
            catch (parseError) {
                console.error('Error parsing socialLinks during update:', parseError);
                reply.status(400).send({ error: 'Invalid format for socialLinks' });
                return;
            }
        }
        updatedProfileData = await prisma.profileData.update({
            where: { id },
            data: updateData,
        });
        if (imageFile && imageFile.data) {
            try {
                const uploadResult = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream({ folder: `profile/${id}`, invalidate: true }, (error, result) => {
                        if (result) {
                            resolve(result);
                        }
                        else {
                            reject(error || new Error('Cloudinary upload failed'));
                        }
                    });
                    uploadStream.end(imageFile.data);
                });
                updatedProfileData = await prisma.profileData.update({
                    where: { id },
                    data: { image: uploadResult.secure_url },
                });
            }
            catch (uploadError) {
                console.error('Cloudinary upload error during update:', uploadError);
                reply.status(500).send({
                    message: 'Profile updated, but new image upload failed.',
                    details: uploadError.message,
                    profileData: updatedProfileData
                });
                return;
            }
        }
        reply.status(200).send(updatedProfileData);
    }
    catch (error) {
        console.error('Update Profile Data Error:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            reply.status(404).send({ message: `Profile data with ID ${id} not found` });
        }
        else {
            reply.status(500).send({ error: 'Failed to update profile data', details: error.message });
        }
    }
};
// Delete ProfileData (Consider Cloudinary Deletion)
export const deleteProfileData = async (request, reply) => {
    const { id } = request.params;
    try {
        const profile = await prisma.profileData.findUnique({
            where: { id },
            select: { image: true }
        });
        if (!profile) {
            reply.status(404).send({ message: `Profile data with ID ${id} not found` });
            return;
        }
        await prisma.profileData.delete({
            where: { id },
        });
        if (profile.image) {
            try {
                const urlParts = profile.image.split('/');
                const publicIdWithExtension = urlParts.slice(urlParts.indexOf('profile')).join('/');
                const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
                if (publicId) {
                    console.log(`Attempting to delete Cloudinary asset: ${publicId}`);
                    await cloudinary.uploader.destroy(publicId);
                    // Optionally delete the folder if empty, but be careful
                    // await cloudinary.api.delete_folder(`profile/${id}`); 
                }
                else {
                    console.warn(`Could not extract public_id from URL: ${profile.image}`);
                }
            }
            catch (cloudinaryError) {
                console.error(`Failed to delete Cloudinary image for profile ${id}: ${cloudinaryError.message}`);
            }
        }
        reply.status(204).send();
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            reply.status(404).send({ message: `Profile data with ID ${id} not found` });
        }
        else {
            console.error('Delete Profile Data Error:', error);
            reply.status(500).send({ error: 'Failed to delete profile data', details: error.message });
        }
    }
};
