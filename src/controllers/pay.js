import axios, { AxiosError } from "axios";
import crypto from "crypto";
function getXVerify(body, saltKey) {
    const gateway = "/pg/v1/pay";
    const base64Payload = getPayLoad(body);
    const dataForChecksum = base64Payload + gateway + saltKey;
    let hash = crypto.createHash("sha256");
    hash.update(dataForChecksum);
    const hashValue = hash.digest("hex");
    const xVerify = hashValue + "###" + 1;
    return xVerify;
}
function getPayLoad(body) {
    const payload = JSON.stringify(body);
    const base64Payload = Buffer.from(payload).toString("base64");
    return base64Payload;
}
async function payTest(req) {
    const saltKey = process.env.SALT_KEY_TEST;
    const payload = getPayLoad(req.body);
    const xVerify = getXVerify(req.body, saltKey);
    const url = process.env.PHONEPE_TEST_URL;
    const headers = {
        "Content-Type": "application/json",
        accept: "application/json",
        "X-VERIFY": xVerify,
    };
    const response = await axios.post(url, JSON.stringify({ request: payload }), { headers: headers });
    return response.data;
}
async function pay(req, saltKey) {
    const payload = getPayLoad(req.body);
    const xVerify = getXVerify(req.body, saltKey);
    const url = process.env.PHONEPE_URL + '/apis/hermes/pg/v1/pay';
    const headers = {
        "Content-Type": "application/json",
        accept: "application/json",
        "X-VERIFY": xVerify,
    };
    try {
        const response = await axios.post(url, JSON.stringify({ request: payload }), { headers: headers });
        return response.data;
    }
    catch (e) {
        console.error("Error", e?.response?.data);
        if (e instanceof AxiosError) {
            return e.response?.data;
        }
        else {
            return e;
        }
    }
}
async function checkPaymentStatus(merchantId, merchantTransactionId, saltKey) {
    try {
        const gateway = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
        const xVerify = getXVerify(gateway, saltKey);
        const headers = {
            'X-MERCHANT-ID': merchantId,
            "X-VERIFY": xVerify,
        };
        const url = process.env.PHONEPE_URL + gateway;
        const response = await axios.get(url, { headers: headers });
        return response.data;
    }
    catch (e) {
        if (e instanceof AxiosError) {
            return e.response?.data;
        }
        else {
            return e;
        }
    }
}
export default {
    pay,
    payTest,
    checkPaymentStatus
};
