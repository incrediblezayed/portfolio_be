import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, Prisma, ProfileData } from '@prisma/client';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// Interface for multipart form data
interface MultipartFile {
    data: Buffer;
    filename: string;
    encoding: string;
    mimetype: string;
    limit: boolean;
}

// Combine Prisma input type with potential file upload field
interface ProfileDataPayload extends Omit<Prisma.ProfileDataCreateInput, 'image'> { 
  images?: MultipartFile[]; 
}

// Create ProfileData (Refactored)
export const createProfileData = async (request: FastifyRequest<{ Body: ProfileDataPayload }>, reply: FastifyReply): Promise<void> => {
  let createdProfileData: ProfileData | null = null; 
  try {
    const { images, ...restOfBody } = request.body;
    const imageFile = images?.[0]; 

    if (imageFile && imageFile.data) {
      try {
        const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: `profile/${Date.now()}` }, 
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

        let prismaData: Prisma.ProfileDataCreateInput;
    try {
      const socialLinks = typeof restOfBody.socialLinks === 'string' ? JSON.parse(restOfBody.socialLinks) : restOfBody.socialLinks;
      prismaData = { ...restOfBody, socialLinks, image: uploadResult.url };
    } catch (parseError) {
      console.error('Error parsing socialLinks:', parseError);
      reply.status(400).send({ error: 'Invalid format for socialLinks' });
      return;
    }

    createdProfileData = await prisma.profileData.create({
      data: prismaData,
    });

    // Explicit check to ensure creation was successful before proceeding
    if (!createdProfileData) {
      throw new Error('Profile data creation failed unexpectedly.');
    }

    reply.status(201).send(createdProfileData);

  } catch (uploadError: any) {
    console.error('Cloudinary upload error after create:', uploadError);
    reply.status(500).send({ 
      message: 'Profile created, but image upload failed.', 
          details: uploadError.message,
          profileData: createdProfileData 
        });
    return; 
  }
} else {
  // If image is required, you might want to handle this case differently
  // reply.status(400).send({ error: 'Profile image is required.' });
  // return;
    }

    reply.status(201).send(createdProfileData);

  } catch (error: any) {
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

// Update ProfileData (Refactored)
interface ProfileDataUpdatePayload extends Omit<Prisma.ProfileDataUpdateInput, 'image'> { 
    images?: MultipartFile[]; 
}
export const updateProfileData = async (request: FastifyRequest<{ Params: { id: string }, Body: ProfileDataUpdatePayload }>, reply: FastifyReply): Promise<void> => {
  const { id } = request.params;
  let updatedProfileData: ProfileData | null = null; 

  try {
    const { images, ...restOfBody } = request.body;
    const imageFile = images?.[0]; 

    let updateData: Prisma.ProfileDataUpdateInput = { ...restOfBody };
    if (updateData.socialLinks && typeof updateData.socialLinks === 'string') {
        try {
            updateData.socialLinks = JSON.parse(updateData.socialLinks);
        } catch (parseError) {
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
        const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: `profile/${id}`, invalidate: true }, 
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

        updatedProfileData = await prisma.profileData.update({
          where: { id },
          data: { image: uploadResult.secure_url }, 
        });
        
      } catch (uploadError: any) {
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

  } catch (error: any) {
    console.error('Update Profile Data Error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      reply.status(404).send({ message: `Profile data with ID ${id} not found` });
    } else {
      reply.status(500).send({ error: 'Failed to update profile data', details: error.message });
    }
  }
};

// Delete ProfileData (Consider Cloudinary Deletion)
export const deleteProfileData = async (request: FastifyRequest<{ Params: { id: string }}>, reply: FastifyReply): Promise<void> => {
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
        } else {
           console.warn(`Could not extract public_id from URL: ${profile.image}`);
        }
      } catch (cloudinaryError: any) {
        console.error(`Failed to delete Cloudinary image for profile ${id}: ${cloudinaryError.message}`);
      }
    }

    reply.status(204).send();
  } catch (error: any) {
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      reply.status(404).send({ message: `Profile data with ID ${id} not found` });
    } else {
      console.error('Delete Profile Data Error:', error);
      reply.status(500).send({ error: 'Failed to delete profile data', details: error.message });
    }
  }
};
