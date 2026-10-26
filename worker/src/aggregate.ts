import { prisma } from "./clients.js";
import { getText, putText, getBuffer, putBuffer } from "./storage.js";

export async function aggregate(jobId: string, totalChunks: number) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  const isCsv = job ? job.fileName.toLowerCase().endsWith(".csv") : true;

  const dotIndex = job ? job.fileName.lastIndexOf(".") : -1;
  const ext = dotIndex !== -1 ? job!.fileName.slice(dotIndex) : (isCsv ? ".csv" : ".bin");
  const outputKey = `results/${jobId}/output${ext}`;

  if (isCsv) {
    const parts: string[] = [];
    for (let i = 0; i < totalChunks; i++) {
      parts.push(await getText(`results/${jobId}/chunk-${i}.csv`));
    }
    await putText(outputKey, parts.join(""));
  } else {
    const buffers: Buffer[] = [];
    for (let i = 0; i < totalChunks; i++) {
      buffers.push(await getBuffer(`results/${jobId}/chunk-${i}.bin`));
    }
    await putBuffer(outputKey, Buffer.concat(buffers));
  }

  await prisma.job.update({
    where: { id: jobId },
    data: { status: "COMPLETED", s3OutputKey: outputKey },
  });
  console.log(`[job ${jobId}] COMPLETED -> ${outputKey}`);
}