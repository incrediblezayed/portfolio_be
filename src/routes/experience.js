import experienceController from "../controllers/experience.js";
const experienceRoute = (fastify, options, done) => {
    fastify.get("/", async (req, res) => {
        try {
            const experience = await experienceController.getAllExperience();
            res.code(200).send(experience);
        }
        catch (e) {
            res.code(500).send(`Internal Server Error ${e}`);
        }
    });
    fastify.post("/", async (req, res) => {
        try {
            if (!req.body) {
                throw "Request body cannot be empty";
            }
            const response = await experienceController.addExperience(req.body);
            res.status(201).send(response);
        }
        catch (error) {
            res.status(500).send(error);
        }
    });
    fastify.put("/:id", async (req, res) => {
        try {
            console.log(req.body);
            console.log(req.params.id);
            if (!req.body || !req.params.id) {
                throw "Request body cannot be empty";
            }
            const response = await experienceController.updateExperience(req.params.id, req.body);
            res.status(200).send(response);
        }
        catch (error) {
            res.status(500).send(error);
        }
    });
    fastify.put("/setActive/:id", async (req, res) => {
        try {
            console.log(req.body);
            console.log(req.params.id);
            if (!req.body || !req.params.id) {
                throw "Request body cannot be empty";
            }
            const response = await experienceController.updateActive(req.params.id, req.body.isActive);
            res.status(200).send(response);
        }
        catch (error) {
            res.status(500).send(error);
        }
    });
    fastify.delete("/:id", async (req, res) => {
        try {
            const response = await experienceController.deleteExperience(req.params.id);
            res.status(200).send(response);
        }
        catch (error) {
            res.status(500).send(error);
        }
    });
    done();
};
export { experienceRoute };
