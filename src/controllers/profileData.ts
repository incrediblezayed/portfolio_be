import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, Prisma, ProfileData } from '@prisma/client';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { MultipartFile } from '@fastify/multipart';

const prisma = new PrismaClient();

// Create ProfileData (Refactored)
export const createProfileData = async (request: FastifyRequest<{ Body:  any }>, reply: FastifyReply): Promise<void> => {
  try {
    // 1. Extract data from request - getting the raw form fields
    const body = request.body as any;
    
    // Get the image buffer
    const imageFile = await body.image.toBuffer();
    
    // 2. Check if image exists
    if (!imageFile) {
      reply.status(400).send({ error: 'Profile image is required.' });
      return;
    }
    
    // 3. Extract only primitive values from each field to avoid circular references
    // For each form field, extract just the value property (which contains the actual data)
    const name = body.name?.value || '';
    const title = body.title?.value || '';
    const tagline = body.tagline?.value || '';
    const resumeUrl = body.resumeUrl?.value || '';
    const email = body.email?.value || '';
    
    // 4. Parse socialLinks
    let socialLinks;
    try {
      // Get the raw string value first
      const socialLinksValue = body.socialLinks?.value;
      socialLinks = typeof socialLinksValue === 'string' 
        ? JSON.parse(socialLinksValue) 
        : {}; // Default to empty object if not provided
    } catch (parseError) {
      console.error('Error parsing socialLinks:', parseError);
      reply.status(400).send({ error: 'Invalid format for socialLinks' });
      return;
    }
    
    // 4. Upload image to Cloudinary
    let uploadResult: UploadApiResponse;
    try {
      uploadResult = await new Promise((resolve, reject) => {
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
        uploadStream.end(imageFile);
      });
    } catch (uploadError: any) {
      console.error('Cloudinary upload error:', uploadError);
      reply.status(500).send({ 
        error: 'Failed to upload profile image', 
        details: uploadError.message 
      });
      return;
    }
    // 5. Create database record with image URL using our clean extracted values
    const prismaData: Prisma.ProfileDataCreateInput = {
      name,
      title,
      tagline,
      resumeUrl,
      email,
      socialLinks,
      image: uploadResult.url
    };
    
    console.log('Prisma data object:', prismaData);

    const createdProfileData = await prisma.profileData.create({
      data: prismaData,
    });
    
    if (!createdProfileData) {
      throw new Error('Profile data creation failed unexpectedly.');
    }
    
    // 6. Return successful response
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


export const updateProfileData = async (request: FastifyRequest<{ Params: { id: string }, Body:  any }>, reply: FastifyReply): Promise<void> => {
  const { id } = request.params;
  let updatedProfileData: ProfileData | null = null; 

  try {
    // Extract data from request - getting the raw form fields
    const body = request.body as any;
    
    // Extract primitive values to avoid circular references
    const name = body.name?.value || '';
    const title = body.title?.value || '';
    const tagline = body.tagline?.value || '';
    const resumeUrl = body.resumeUrl?.value || '';
    const email = body.email?.value || '';
    
    // Parse socialLinks
    let socialLinks;
    try {
        const socialLinksValue = body.socialLinks?.value;
        if (socialLinksValue && typeof socialLinksValue === 'string') {
            socialLinks = JSON.parse(socialLinksValue);
        }
    } catch (parseError) {
        console.error('Error parsing socialLinks during update:', parseError);
        reply.status(400).send({ error: 'Invalid format for socialLinks' });
        return;
    }
    
    // Create clean update data object with primitive values
    let updateData: Prisma.ProfileDataUpdateInput = {
        name,
        title,
        tagline,
        resumeUrl,
        email
    };
    
    // Only include socialLinks if it was provided and parsed successfully
    if (socialLinks) {
        updateData.socialLinks = socialLinks;
    }

    // First update with the basic data
    updatedProfileData = await prisma.profileData.update({
      where: { id },
      data: updateData,
    });

    // 3. Check if an image was provided and handle upload
    if (body.image) {
      try {
        // Get image buffer
        const imageBuffer = await body.image.toBuffer();
        
        if (imageBuffer) {
          // Upload to Cloudinary
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
            uploadStream.end(imageBuffer);
          });

          updatedProfileData = await prisma.profileData.update({
            where: { id },
            data: { image: uploadResult.secure_url }, 
          });
        }
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
