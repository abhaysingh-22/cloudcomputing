import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./s3.js";
import { env } from "../config/env.js";

export type ByteRange = { index: number; startByte: number; endByte: number };

// Read a small byte window from S3
async function readRange(key: string, start: number, end: number): Promise<Buffer> {
  const res = await s3.send(
    new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Range: `bytes=${start}-${end}`,
    })
  );
  const bytes = await res.Body!.transformToByteArray();
  return Buffer.from(bytes);
}

export async function getObjectSize(key: string): Promise<number> {
  const head = await s3.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  return head.ContentLength ?? 0;
}

/**
 * Split an S3 object into byte ranges that end on newline boundaries.
 * endByte is inclusive.
 */
export async function computeChunks(
  key: string,
  totalSize: number,
  targetSize: number
): Promise<ByteRange[]> {
  const ranges: ByteRange[] = [];
  let start = 0;
  let index = 0;

  while (start < totalSize) {
    let end = Math.min(start + targetSize - 1, totalSize - 1);

    if (end < totalSize - 1) {
      // Move forward until we find a newline, so we never cut a row in half
      let cursor = end;
      let found = false;
      while (cursor < totalSize - 1 && !found) {
        const windowEnd = Math.min(cursor + 8191, totalSize - 1);
        const buf = await readRange(key, cursor, windowEnd);
        const nl = buf.indexOf(0x0a);
        if (nl !== -1) {
          end = cursor + nl; // include the newline in this chunk
          found = true;
        } else {
          cursor = windowEnd + 1;
        }
      }
      if (!found) end = totalSize - 1;
    }

    ranges.push({ index, startByte: start, endByte: end });
    start = end + 1;
    index++;
  }

  return ranges;
}
