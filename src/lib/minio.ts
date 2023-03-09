import minio from 'minio';
import crypto from 'crypto';

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

const client = config ? new minio.Client(config) : null;

export default client;

export const uploadImage = async (file: File) => {
  if (!client) return null;
  if (!(await client.bucketExists('uploads'))) return null;

  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const name = `${hash}.${file.name.split('.').at(-1)}`;

  const res = await new Promise((resolve, reject) =>
    client.putObject('uploads', name, buffer, (err, etag) => {
      if (err) reject(err);
      else resolve(etag);
    })
  )
    .then((etag) => etag)
    .catch((err) => null);

  if (!res) return null;

  return name;
};
