import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../lib/prisma.js";
import { s3Public } from "../lib/s3.js";
import { sqs } from "../lib/sqs.js";
import { computeChunks, getObjectSize } from "../lib/chunker.js";
import { env } from "../config/env.js";

const router = Router();

const createJobSchema = z.object({
  fileName: z
    .string()
    .min(1)
    .refine((n) => n.toLowerCase().endsWith(".csv"), "Only .csv files are allowed"),
});

// Create a job and get a presigned upload URL
router.post("/", async (req, res) => {
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const jobId = randomUUID();
  const s3InputKey = `uploads/${req.userId}/${jobId}/input.csv`;

  const job = await prisma.job.create({
    data: {
      id: jobId,
      userId: req.userId!,
      fileName: parsed.data.fileName,
      s3InputKey,
    },
  });

  const uploadUrl = await getSignedUrl(
    s3Public,
    new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: s3InputKey }),
    { expiresIn: 900 }
  );

  res.status(201).json({ job, uploadUrl });
});

// List my jobs
router.get("/", async (req, res) => {
  const jobs = await prisma.job.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(jobs);
});

// Get one job
router.get("/:id", async (req, res) => {
  const job = await prisma.job.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

// Start processing: chunk the file and queue the work
router.post("/:id/start", async (req, res) => {
  const job = await prisma.job.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!job) return res.status(404).json({ error: "Job not found" });
  if (job.status !== "UPLOADING") {
    return res.status(409).json({ error: `Job is already ${job.status}` });
  }

  let size: number;
  try {
    size = await getObjectSize(job.s3InputKey);
  } catch {
    return res.status(400).json({ error: "File not found in S3. Upload it first." });
  }
  if (size === 0) return res.status(400).json({ error: "File is empty" });

  const ranges = await computeChunks(job.s3InputKey, size, env.CHUNK_SIZE_BYTES);

  await prisma.$transaction([
    prisma.chunk.createMany({
      data: ranges.map((r) => ({
        jobId: job.id,
        index: r.index,
        startByte: BigInt(r.startByte),
        endByte: BigInt(r.endByte),
      })),
    }),
    prisma.job.update({
      where: { id: job.id },
      data: { status: "QUEUED", totalChunks: ranges.length },
    }),
  ]);

  for (let i = 0; i < ranges.length; i += 10) {
    const batch = ranges.slice(i, i + 10);
    await sqs.send(
      new SendMessageBatchCommand({
        QueueUrl: env.SQS_QUEUE_URL,
        Entries: batch.map((r) => ({
          Id: String(r.index),
          MessageBody: JSON.stringify({
            jobId: job.id,
            chunkIndex: r.index,
            s3Key: job.s3InputKey,
            startByte: r.startByte,
            endByte: r.endByte,
          }),
        })),
      })
    );
  }

  res.json({ jobId: job.id, status: "QUEUED", totalChunks: ranges.length });
});

// Temporary download link for the processed file
router.get("/:id/download", async (req, res) => {
  const job = await prisma.job.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!job) return res.status(404).json({ error: "Job not found" });

  if (job.status !== "COMPLETED" || !job.s3OutputKey) {
    return res.status(409).json({ error: `Job is ${job.status}, not ready for download` });
  }

  const downloadName = job.fileName.replace(/\.csv$/i, "") + "-processed.csv";

  const downloadUrl = await getSignedUrl(
    s3Public,
    new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: job.s3OutputKey,
      ResponseContentDisposition: `attachment; filename="${downloadName}"`,
    }),
    { expiresIn: 300 }
  );

  res.json({ downloadUrl, fileName: downloadName });
});

export default router;