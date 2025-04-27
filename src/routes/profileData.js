import { createProfileData, getProfileData, updateProfileData, deleteProfileData, } from '../controllers/profileData.js';
const profileDataRoute = (fastify, options, done) => {
    // Route to create profile data
    fastify.post('/', createProfileData);
    // Route to get profile data (fetches the first entry)
    fastify.get('/', getProfileData);
    // Route to update profile data by ID
    fastify.put('/:id', updateProfileData);
    // Route to delete profile data by ID
    fastify.delete('/:id', deleteProfileData);
    done();
};
export { profileDataRoute };
