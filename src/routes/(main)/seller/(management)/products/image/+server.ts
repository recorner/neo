import { userFromToken } from '$lib/util';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Role } from '@prisma/client';
import { uploadImage } from '$lib/minio';

export const POST: RequestHandler = async ({ cookies, request }) => {
  const user = userFromToken(cookies.get('__token'));
  if (!user || !user.role.includes(Role.SELLER)) return json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.formData();

  const file = body.get('file');
  if (!file || typeof file == 'string') return json({ error: 'invalid file' }, { status: 400 });

  const image = await uploadImage(file);
  if (!image) return json({ error: 'failed to upload' }, { status: 500 });

  return json({ image: `${process.env.UPLOAD_PREFIX}/${image}` });
};
