import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

function config(): R2Config {
  const values = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? process.env.R2_ACCOUNT_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET_NAME ?? process.env.R2_BUCKET,
  };
  const missing = Object.entries(values).filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) throw new Error(`R2 is not configured: ${missing.join(", ")}`);
  return values as R2Config;
}

let client: S3Client | undefined;

function getClient() {
  const r2 = config();
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: r2.accessKeyId, secretAccessKey: r2.secretAccessKey },
  });
  return { client, bucket: r2.bucket };
}

export async function createAssetUploadUrl(input: {
  objectKey: string;
  mimeType: string;
  size: number;
  checksum?: string;
}) {
  const { client: r2, bucket } = getClient();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: input.objectKey,
    ContentType: input.mimeType,
    ContentLength: input.size,
    ChecksumSHA256: input.checksum
      ? Buffer.from(input.checksum, "hex").toString("base64")
      : undefined,
  });
  return getSignedUrl(r2, command, { expiresIn: 10 * 60 });
}

export async function verifyAssetObject(objectKey: string) {
  const { client: r2, bucket } = getClient();
  return r2.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
}

export async function createAssetDownloadUrl(input: {
  objectKey: string;
  filename: string;
  mimeType: string;
}) {
  const { client: r2, bucket } = getClient();
  const filename = input.filename.replace(/["\\\r\n]/g, "_");
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: input.objectKey,
    ResponseContentType: input.mimeType,
    ResponseContentDisposition: `inline; filename="${filename}"`,
  });
  return getSignedUrl(r2, command, { expiresIn: 5 * 60 });
}

export async function deleteAssetObject(objectKey: string) {
  const { client: r2, bucket } = getClient();
  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
}
