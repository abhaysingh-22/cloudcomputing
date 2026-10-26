import "dotenv/config";
import { z } from "zod";

export const env = z
  .object({
    DATABASE_URL: z.string(),
    AWS_REGION: z.string(),
    AWS_ENDPOINT_URL: z.string().optional(),
    S3_BUCKET: z.string(),
    SQS_QUEUE_URL: z.string(),
    MAX_ATTEMPTS: z.coerce.number().default(3),
  })
  .parse(process.env);