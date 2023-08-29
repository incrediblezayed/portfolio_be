import axios, { AxiosResponse } from "axios";
import crypto from "crypto";

function getXVerify(body: any, saltKey: string): string {
  const gateway = "/pg/v1/pay";

  const base64Payload = getPayLoad(body);
  const dataForChecksum = base64Payload + gateway + saltKey;
  let hash = crypto.createHash("sha256");
  hash.update(dataForChecksum);
  const hashValue = hash.digest("hex");
  const xVerify = hashValue + "###" + 1;
  return xVerify;
}

function getPayLoad(body: any): string {
  const payload = JSON.stringify(body);
  const base64Payload = Buffer.from(payload).toString("base64");
  return base64Payload;
}

async function payTest(req: any): Promise<any> {
  const saltKey = process.env.SALT_KEY_TEST;
  const payload = getPayLoad(req.body);
  const xVerify = getXVerify(req.body, saltKey!);
  const url = process.env.PHONEPE_TEST_URL;
  const headers = {
    "Content-Type": "application/json",
    accept: "application/json",
    "X-VERIFY": xVerify,
  };
  const response = await axios.post(
    url!,
    JSON.stringify({ request: payload }),
    { headers: headers }
  );
  return response.data;
}

async function pay(req: any): Promise<any> {
  const saltKey = process.env.SALT_KEY;
  const payload = getPayLoad(req.body);
  const xVerify = getXVerify(req.body, saltKey!);
  const url = process.env.PHONEPE_URL;
  const headers = {
    "Content-Type": "application/json",
    accept: "application/json",
    "X-VERIFY": xVerify,
  };
  const response = await axios.post(
    url!,
    JSON.stringify({ request: payload }),
    { headers: headers }
  );
  return response.data;
}

export default {
  pay,
  payTest,
};
