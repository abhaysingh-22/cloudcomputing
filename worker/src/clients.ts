import { PrismaClient } from "@prisma/client";
import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { env } from "./env.js";

export const prisma = new PrismaClient();

export const s3 = new S3Client({
  region: env.AWS_REGION,
  endpoint: env.AWS_ENDPOINT_URL,
  forcePathStyle: !!env.AWS_ENDPOINT_URL,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export const sqs = new SQSClient({
  region: env.AWS_REGION,
  endpoint: env.AWS_ENDPOINT_URL,
});