import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, Prisma, ProfileData } from '@prisma/client';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// Interface for multipart form data (adjust based on actual file object structure from @fastify/multipart)
interface MultipartFile {
    data: Buffer;
    filename: string;
    encoding: string;
    mimetype: string;
    limit: boolean;
}

// Combine Prisma input type with potential file upload field
interface ProfileDataPayload extends Omit<Prisma.ProfileDataCreateInput, 'image'> { // Omit imageUrl as it's handled separately
  image?: MultipartFile[]; // Optional image field from multipart
}

// Create ProfileData
export const createProfileData = async (request: FastifyRequest<{ Body: ProfileDataPayload }>, reply: FastifyReply): Promise<void> => {
  try {
    const { image, ...restOfBody } = request.body;
    let imageUrl: string = ''; // Initialize required imageUrl
    let imageFile: MultipartFile | undefined = undefined;

    // Ensure 'socialLinks' is handled correctly if it's part of the payload and needs parsing
    // Example: if socialLinks is sent as a stringified JSON
    let prismaData: Prisma.ProfileDataCreateInput;
    try {
      const socialLinks = typeof restOfBody.socialLinks === 'string' ? JSON.parse(restOfBody.socialLinks) : restOfBody.socialLinks;
      prismaData = { ...restOfBody, socialLinks, image: '' }; // Include empty imageUrl initially
    } catch (parseError) {
      console.error('Error parsing socialLinks:', parseError);
      reply.status(400).send({ error: 'Invalid format for socialLinks' });
      return;
    }

    // Check if image file is present
    if (image && image[0] && image[0].data) {
      imageFile = image[0];
    } else {
        // If image is required for creation (adjust based on requirements)
        reply.status(400).send({ error: 'Profile image is required.' });
        return;
    }

    // Upload image *first* to get the URL
    if (imageFile) { 
        try {
            const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: `profile/temp` }, // Upload to temp, use ID later if needed
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error || new Error('Cloudinary upload failed'));
                        }
                    }
                );
                uploadStream.end(imageFile.data);
            });
            imageUrl = uploadResult.secure_url;
            prismaData.image = imageUrl; // Set the actual imageUrl
        } catch (uploadError: any) {
            console.error('Cloudinary upload error during create:', uploadError);
            reply.status(500).send({ error: 'Failed to upload profile image', details: uploadError.message });
            return;
        }
    } else {
         // This case should not be reached due to the earlier required check
         reply.status(400).send({ error: 'Image file data missing unexpectedly.' });
         return;
    }

    // Create the profile data record with the imageUrl
    const profileData = await prisma.profileData.create({
      data: prismaData,
    });

    // Optionally: Rename Cloudinary folder/asset using the final profileData.id if needed
    // Example: await cloudinary.uploader.rename(`profile/temp/${uploadResult.public_id}`, `profile/${profileData.id}/${uploadResult.public_id}`);

    reply.status(201).send(profileData);

  } catch (error: any) {
    // Handle potential Prisma errors (e.g., unique constraints)
    console.error('Create Profile Data Error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Example: Unique constraint violation
        if (error.code === 'P2002') {
            reply.status(409).send({ error: 'Profile data conflict', details: 'A profile record might already exist or violates constraints.' });
            return;
        }
    }
    reply.status(500).send({ error: 'Failed to create profile data', details: error.message });
  }
};

// Get all ProfileData
export const getProfileData = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const profileData = await prisma.profileData.findFirst();
    if (profileData) {
      reply.status(200).send(profileData);
    } else {
      reply.status(404).send({ message: 'Profile data not found' });
    }
  } catch (error: any) {
    reply.status(500).send({ error: 'Failed to retrieve profile data', details: error.message });
  }
};

// Update ProfileData
interface ProfileDataUpdatePayload extends Omit<Prisma.ProfileDataUpdateInput, 'image'> {
    image?: MultipartFile[];
}
export const updateProfileData = async (request: FastifyRequest<{ Params: { id: string }, Body: ProfileDataUpdatePayload }>, reply: FastifyReply): Promise<void> => {
  const { id } = request.params;
  try {
    const { image, ...restOfBody } = request.body;
    let updateData: Prisma.ProfileDataUpdateInput = { ...restOfBody };

    // Ensure 'socialLinks' is handled correctly if it's part of the payload
    if (updateData.socialLinks && typeof updateData.socialLinks === 'string') {
        try {
            updateData.socialLinks = JSON.parse(updateData.socialLinks);
        } catch (parseError) {
            console.error('Error parsing socialLinks during update:', parseError);
            reply.status(400).send({ error: 'Invalid format for socialLinks' });
            return;
        }
    } else if (updateData.socialLinks === null) {
        // If explicitly set to null and schema allows, handle accordingly
        // updateData.socialLinks = Prisma.DbNull; // Example if nullable
    }

    // Check if a new image file is provided
    if (image && image[0] && image[0].data) {
      const currentImageFile = image[0];
      
      try {
          let imageUrl: string | undefined = undefined; 
          const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: `profile/${id}`, invalidate: true }, // Overwrite if exists
              (error, result) => {
                if (result) {
                  resolve(result);
                } else {
                  reject(error || new Error('Cloudinary upload failed'));
                }
              }
            );
            uploadStream.end(currentImageFile.data); 
          });
          imageUrl = uploadResult.secure_url;
          updateData.image = imageUrl;
          // Consider deleting the old image from Cloudinary here
      } catch (uploadError: any) {
         console.error('Cloudinary upload error during update:', uploadError);
         reply.status(500).send({ error: 'Failed to upload profile image during update', details: uploadError.message });
         return;
      }
    } 
    // If no new image is provided, updateData simply won't have the imageUrl field set,
    // so Prisma will not update it, preserving the existing one.

    const profileData = await prisma.profileData.update({
      where: { id },
      data: updateData,
    });
    reply.status(200).send(profileData);
  } catch (error: any) {
    console.error('Update Profile Data Error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      reply.status(404).send({ message: `Profile data with ID ${id} not found` });
    } else {
      reply.status(500).send({ error: 'Failed to update profile data', details: error.message });
    }
  }
};

// Delete ProfileData
export const deleteProfileData = async (request: FastifyRequest<{ Params: { id: string }}>, reply: FastifyReply): Promise<void> => {
  const { id } = request.params;
  try {
    // Optional: Get the imageUrl before deleting to delete from Cloudinary
    // const profile = await prisma.profileData.findUnique({ where: { id }, select: { imageUrl: true } });

    await prisma.profileData.delete({
      where: { id },
    });

    // Optional: Delete associated Cloudinary folder/image after successful DB deletion
    // if (profile && profile.imageUrl) { 
    //    const publicId = ...; // Extract public_id from profile.imageUrl
    //    await cloudinary.uploader.destroy(publicId);
    //    await cloudinary.api.delete_folder(`profile/${id}`); 
    // }

    reply.status(204).send();
  } catch (error: any) {
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      reply.status(404).send({ message: `Profile data with ID ${id} not found` });
    } else {
      reply.status(500).send({ error: 'Failed to delete profile data', details: error.message });
    }
  }
};
