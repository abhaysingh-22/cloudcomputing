import { SQSClient } from "@aws-sdk/client-sqs";
import { env } from "../config/env.js";

export const sqs = new SQSClient({
    region: env.AWS_REGION,
    endpoint: env.AWS_ENDPOINT_URL,
});
