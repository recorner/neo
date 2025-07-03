import type { RequestHandler } from './$types';
// import { createCanvas, loadImage } from 'canvas';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const randomColor = () =>
  'rgb(' +
  Math.floor(Math.random() * 255) +
  ',' +
  Math.floor(Math.random() * 255) +
  ',' +
  Math.floor(Math.random() * 255) +
  ')';
const fonts = ['Impact', 'Comic Sans MS', 'Arial Black'];

const randomString = (length: number, chars: string) => {
  let result = '';
  for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

export const GET: RequestHandler = async ({ cookies, url }) => {
  let code = randomString(6, '0123456789');
  // randomly capitalize letters
  for (let i = 0; i < code.length; i++) {
    if (Math.random() > 0.5) {
      code = code.substring(0, i) + code[i].toUpperCase() + code.substring(i + 1);
    }
  }
  const rng = crypto.randomBytes(16).toString('base64');
  cookies.set('rng', rng, {
    httpOnly: true,
    maxAge: 3 * 60 * 1000,
    path: '/',
  });
  cookies.set(
    'captcha',
    jwt.sign(
      {
        h: crypto
          .createHash('sha256')
          .update(code + rng)
          .digest('base64'),
      },
      process.env.JWT_SECRET || '1',
      {
        expiresIn: '3m',
      }
    ),
    {
      httpOnly: true,
      maxAge: 3 * 60 * 1000,
      path: '/',
    }
  );

  // TODO: Fix canvas implementation
  // For now, return a simple placeholder response
  return new Response(Buffer.from('placeholder captcha image'), {
    headers: {
      'Content-Type': 'image/png',
    },
  });
};
