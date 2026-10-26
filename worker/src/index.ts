import {
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { prisma, sqs } from "./clients.js";
import { env } from "./env.js";
import { processChunk, type ChunkMessage } from "./processChunk.js";
import { aggregate } from "./aggregate.js";

let running = true;
process.on("SIGTERM", () => (running = false)); // Kubernetes sends this on shutdown
process.on("SIGINT", () => (running = false));

async function handle(msg: ChunkMessage) {
  const { jobId, chunkIndex } = msg;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found");
  if (job.status === "FAILED" || job.status === "COMPLETED") return;

  const chunk = await prisma.chunk.findUnique({
    where: { jobId_index: { jobId, index: chunkIndex } },
  });
  if (!chunk) throw new Error("Chunk not found");

  // Duplicate delivery of a finished chunk: safe to skip,
  // but finish aggregation if a previous worker crashed before doing it
  if (chunk.status === "DONE") {
    if (job.completedChunks === job.totalChunks) await aggregate(jobId, job.totalChunks);
    return;
  }

  await prisma.job.updateMany({
    where: { id: jobId, status: "QUEUED" },
    data: { status: "PROCESSING" },
  });
  await prisma.chunk.update({
    where: { id: chunk.id },
    data: { status: "PROCESSING", attempts: { increment: 1 } },
  });

  const resultKey = await processChunk(msg);

  // Atomic: mark DONE and bump the counter together, only once per chunk
  const updated = await prisma.$transaction(async (tx) => {
    const r = await tx.chunk.updateMany({
      where: { id: chunk.id, status: { not: "DONE" } },
      data: { status: "DONE", s3ResultKey: resultKey },
    });
    if (r.count === 0) return null;
    return tx.job.update({
      where: { id: jobId },
      data: { completedChunks: { increment: 1 } },
    });
  });

  console.log(`[job ${jobId}] chunk ${chunkIndex} done`);

  // Only the worker that finishes the LAST chunk sees completed == total
  if (updated && updated.completedChunks === updated.totalChunks) {
    await aggregate(jobId, updated.totalChunks);
  }
}

async function handleFailure(msg: ChunkMessage, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const chunk = await prisma.chunk.findUnique({
    where: { jobId_index: { jobId: msg.jobId, index: msg.chunkIndex } },
  });
  console.error(`[job ${msg.jobId}] chunk ${msg.chunkIndex} failed (attempt ${chunk?.attempts}):`, message);

  if (chunk && chunk.attempts >= env.MAX_ATTEMPTS) {
    await prisma.chunk.update({ where: { id: chunk.id }, data: { status: "FAILED" } });
    await prisma.job.update({
      where: { id: msg.jobId },
      data: { status: "FAILED", error: `Chunk ${msg.chunkIndex}: ${message}` },
    });
    return true; // give up: delete the message
  }
  return false; // keep the message: SQS will redeliver it
}

async function main() {
  console.log("Worker started, polling SQS...");
  while (running) {
    const res = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: env.SQS_QUEUE_URL,
        MaxNumberOfMessages: 5,
        WaitTimeSeconds: 10, // long polling
        VisibilityTimeout: 60, // other workers can't see it while we work
      })
    );

    for (const m of res.Messages ?? []) {
      const body = JSON.parse(m.Body!) as ChunkMessage;
      let shouldDelete = false;
      try {
        await handle(body);
        shouldDelete = true; // delete ONLY after success
      } catch (err) {
        shouldDelete = await handleFailure(body, err);
      }
      if (shouldDelete) {
        await sqs.send(
          new DeleteMessageCommand({ QueueUrl: env.SQS_QUEUE_URL, ReceiptHandle: m.ReceiptHandle! })
        );
      }
    }
  }
  await prisma.$disconnect();
  console.log("Worker stopped cleanly");
}

main();