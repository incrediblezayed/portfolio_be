import paymentController from "../controllers/pay.js";
const payRoute = (fastify, options, done) => {
    /*   fastify.post("/pay", async (req, res) => {
        const response = await paymentController.pay(req, process.env.SALT_KEY);
        res.send(response);
      }); */
    fastify.post("/payGharTak", async (req, res) => {
        const response = await paymentController.pay(req, process.env.SALT_KEY_GHARTAK);
        res.send(response);
    });
    fastify.post("/payTest", async (req, res) => {
        const response = await paymentController.payTest(req);
        res.send(response);
    });
    fastify.get("/checkPaymentStatusGhartak/:transactionId", async (req, res) => {
        const response = await paymentController.checkPaymentStatus(process.env.MERCHANT_ID_GHARTAK, req.params.transactionId, process.env.SALT_KEY_GHARTAK);
        res.send(response);
    });
    done();
};
export { payRoute };
