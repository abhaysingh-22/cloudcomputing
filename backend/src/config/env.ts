import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(16),
  FRONTEND_URL: z.string(),
  AWS_REGION: z.string(),
  AWS_ENDPOINT_URL: z.string().optional(),
  S3_PUBLIC_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string(),
  SQS_QUEUE_URL: z.string(),
  CHUNK_SIZE_BYTES: z.coerce.number().default(64 * 1024 * 1024),
});

export const env = schema.parse(process.env);