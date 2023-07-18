import techStackController from "../controllers/techStack.js";
const techStackRouter = (fastify, options, done) => {
    fastify.get("/", async (req, res) => {
        try {
            const techStack = await techStackController.getTechStack();
            res.send(techStack);
        }
        catch (error) {
            res.status(500).send(error);
        }
    });
    fastify.get("/:id", async (req, res) => {
        try {
            const techStack = await techStackController.getTechStackById(req.params.id);
            res.send(techStack);
        }
        catch (error) {
            res.status(500).send(error);
        }
    });
    fastify.post("/", async (req, res) => {
        try {
            const techStack = await techStackController.createTechStack(req.body);
            res.send(techStack);
        }
        catch (error) {
            res.status(500).send(error);
        }
    });
    fastify.put("/:id", async (req, res) => {
        try {
            const techStack = await techStackController.updateTechStack(req.params.id, req.body);
            res.send(techStack);
        }
        catch (error) {
            res.status(500).send(error);
        }
    });
    fastify.delete("/:id", async (req, res) => {
        try {
            const techStack = await techStackController.deleteTechStack(req.params.id);
            res.send(techStack);
        }
        catch (error) {
            res.status(500).send(error);
        }
    });
    done();
};
export { techStackRouter };
