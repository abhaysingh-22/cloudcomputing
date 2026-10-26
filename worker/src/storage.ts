import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./clients.js";
import { env } from "./env.js";

export async function readRange(key: string, start: number, end: number): Promise<Buffer> {
  const res = await s3.send(
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key, Range: `bytes=${start}-${end}` })
  );
  return Buffer.from(await res.Body!.transformToByteArray());
}

export async function getText(key: string): Promise<string> {
  const res = await s3.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  return res.Body!.transformToString("utf-8");
}

export async function putText(key: string, body: string) {
  await s3.send(
    new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, Body: body, ContentType: "text/csv" })
  );
}

export async function getBuffer(key: string): Promise<Buffer> {
  const res = await s3.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  return Buffer.from(await res.Body!.transformToByteArray());
}

export async function putBuffer(key: string, body: Buffer, contentType: string = "application/octet-stream") {
  await s3.send(
    new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, Body: body, ContentType: contentType })
  );
}