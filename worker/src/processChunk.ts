import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { readRange, putText } from "./storage.js";

export type ChunkMessage = {
  jobId: string;
  chunkIndex: number;
  s3Key: string;
  startByte: number;
  endByte: number;
};

async function readHeaderLine(key: string): Promise<string> {
  const buf = await readRange(key, 0, 8191);
  const nl = buf.indexOf(0x0a);
  const line = (nl === -1 ? buf : buf.subarray(0, nl)).toString("utf8");
  return line.replace(/\r$/, "");
}

// Returns the S3 key of the processed chunk
export async function processChunk(msg: ChunkMessage): Promise<string> {
  const { jobId, chunkIndex, s3Key, startByte, endByte } = msg;

  const headerLine = await readHeaderLine(s3Key);
  const columns = (parse(headerLine, { bom: true, trim: true })[0] ?? []) as string[];

  let text = (await readRange(s3Key, startByte, endByte)).toString("utf8");
  // Chunk 0 already contains the header. Other chunks need it prepended.
  if (chunkIndex > 0) text = headerLine + "\n" + text;

  const rows = parse(text, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  // The "processing": trim every value, lowercase the email column
  const cleaned = rows.map((row) => {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      const v = (value ?? "").trim();
      out[key] = key.trim().toLowerCase() === "email" ? v.toLowerCase() : v;
    }
    return out;
  });

  // Only chunk 0 writes the header, so merging is a plain concatenation
  const csv = stringify(cleaned, { header: chunkIndex === 0, columns });

  // Deterministic key: re-processing the same chunk overwrites, never duplicates
  const resultKey = `results/${jobId}/chunk-${chunkIndex}.csv`;
  await putText(resultKey, csv);
  return resultKey;
}