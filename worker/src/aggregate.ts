import { prisma } from "./clients.js";
import { getText, putText } from "./storage.js";

export async function aggregate(jobId: string, totalChunks: number) {
  const parts: string[] = [];
  for (let i = 0; i < totalChunks; i++) {
    parts.push(await getText(`results/${jobId}/chunk-${i}.csv`));
  }

  const outputKey = `results/${jobId}/output.csv`;
  await putText(outputKey, parts.join(""));

  await prisma.job.update({
    where: { id: jobId },
    data: { status: "COMPLETED", s3OutputKey: outputKey },
  });
  console.log(`[job ${jobId}] COMPLETED -> ${outputKey}`);
}