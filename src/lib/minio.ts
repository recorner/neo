import { Client } from 'minio';
import crypto from 'crypto';
import sharp from 'sharp';

const config =
  process.env.MINIO_ENDPOINT && process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY
    ? {
        endPoint: process.env.MINIO_ENDPOINT?.split('://')[1].split(':')[0],
        port: parseInt(process.env.MINIO_ENDPOINT?.split(':').at(-1) || '9000'),
        useSSL: process.env.MINIO_ENDPOINT?.startsWith('https'),
        accessKey: process.env.MINIO_ACCESS_KEY,
        secretKey: process.env.MINIO_SECRET_KEY,
      }
    : null;

const client = config ? new Client(config) : null;

export default client;

export const uploadImage = async (file: File) => {
  if (!client) return null;
  if (!(await client.bucketExists('uploads'))) return null;

  // validate file
  const buffer = Buffer.from(await file.arrayBuffer());
  if (
    !(await sharp(buffer)
      .metadata()
      .catch(() => null))
  )
    return null;

  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const name = `${hash}.${file.name.split('.').at(-1)}`;

  try {
    const etag = await client.putObject('uploads', name, buffer);
    return name;
  } catch (err) {
    return null;
  }
};
