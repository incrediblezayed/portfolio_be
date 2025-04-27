import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, Prisma, ProfileData } from '@prisma/client';

const prisma = new PrismaClient();

// Create ProfileData
export const createProfileData = async (request: FastifyRequest<{ Body: Prisma.ProfileDataCreateInput }>, reply: FastifyReply): Promise<void> => {
  try {
    const profileData = await prisma.profileData.create({
      data: request.body,
    });
    reply.status(201).send(profileData);
  } catch (error: any) {
    reply.status(500).send({ error: 'Failed to create profile data', details: error.message });
  }
};

// Get all ProfileData (assuming only one profile exists, get the first one)
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
export const updateProfileData = async (request: FastifyRequest<{ Params: { id: string }, Body: Prisma.ProfileDataUpdateInput }>, reply: FastifyReply): Promise<void> => {
  const { id } = request.params;
  try {
    const profileData = await prisma.profileData.update({
      where: { id },
      data: request.body,
    });
    reply.status(200).send(profileData);
  } catch (error: any) {
    if (error.code === 'P2025') {
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
    await prisma.profileData.delete({
      where: { id },
    });
    reply.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      reply.status(404).send({ message: `Profile data with ID ${id} not found` });
    } else {
      reply.status(500).send({ error: 'Failed to delete profile data', details: error.message });
    }
  }
};
