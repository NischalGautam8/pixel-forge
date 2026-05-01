import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY || '',
    secretAccessKey: process.env.R2_SECRET_KEY || '',
  },
});

export async function getUploadUrl(bucket: string, key: string, contentType: string): Promise<string> {
  return getSignedUrl(r2, new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  }), { expiresIn: 3600 });
}

export async function getDownloadUrl(bucket: string, key: string): Promise<string> {
  return getSignedUrl(r2, new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  }), { expiresIn: 86400 });
}

export async function uploadBuffer(bucket: string, key: string, buffer: Buffer, contentType: string): Promise<void> {
  await r2.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType
  }));
}

