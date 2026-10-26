import { S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";

const common = {
  region: env.AWS_REGION,
  requestChecksumCalculation: "WHEN_REQUIRED" as const,
  responseChecksumValidation: "WHEN_REQUIRED" as const,
};

// Used by the server itself (chunker, HeadObject, etc.)
export const s3 = new S3Client({
  ...common,
  endpoint: env.AWS_ENDPOINT_URL,
  forcePathStyle: !!env.AWS_ENDPOINT_URL,
});

// Used ONLY to sign URLs that the browser will open
const publicEndpoint = env.S3_PUBLIC_ENDPOINT ?? env.AWS_ENDPOINT_URL;
export const s3Public = new S3Client({
  ...common,
  endpoint: publicEndpoint,
  forcePathStyle: !!publicEndpoint,
});