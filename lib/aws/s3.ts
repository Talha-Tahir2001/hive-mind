import "dotenv/config";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const globalForS3 = globalThis as unknown as {
  s3Client: S3Client | undefined;
};

export const s3Client =
  globalForS3.s3Client ??
  new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForS3.s3Client = s3Client;
}

const BUCKET = process.env.S3_BUCKET;

export async function uploadMemoryExport(
  data: string,
  filename: string
): Promise<string> {
  const key = `exports/${filename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: Buffer.from(data),
    ContentType: "application/json",
  });

  await s3Client.send(command);

  // Return a presigned URL (valid for 1 hour)
  const getCommand = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
  return url;
}