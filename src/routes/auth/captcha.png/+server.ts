import type { RequestHandler } from './$types';
import { createCanvas, loadImage } from 'canvas';
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

  const canvas = createCanvas(200, 80);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // Set the fill color to transparent
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the canvas with the transparent color

  for (let i = 0; i < Math.random() * 20 + 20; i++) {
    ctx.rotate(Math.random() * 0.4 - 0.2);
    ctx.strokeStyle = randomColor();
    ctx.lineWidth = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.arc(Math.random() * 200, Math.random() * 80, Math.random() * 30, 0, Math.random() * 2 * Math.PI);
    ctx.stroke();
    ctx.resetTransform();
  }

  let x = Math.random() * 10 + 10;
  const codeData = code.split('').map((c, i) => {
    const sizeAndFont = Math.random() * 5 + 45 + 'px ' + fonts[Math.floor(Math.random() * fonts.length)];
    // calculate the width of the letter
    ctx.font = sizeAndFont;
    const size = ctx.measureText(c);
    const position = {
      x: x,
      y: Math.random() * 20 + 50,
    };
    x += size.width;

    return {
      letter: c,
      sizeAndFont,
      size,
      position,
      rotation: Math.random() * 0.4 - 0.2,
    };
  });

  // draw the letters
  codeData.forEach((c) => {
    ctx.font = c.sizeAndFont;
    ctx.rotate(c.rotation);
    ctx.fillStyle = `hsl(${Math.random() * 360}, ${Math.random() * 10 + 80}%, ${Math.random() * 10 + 80}%)`;
    ctx.fillText(c.letter, c.position.x, c.position.y);
    ctx.resetTransform();
  });

  for (let i = 0; i < 2; i++) {
    ctx.strokeStyle = randomColor();
    ctx.lineWidth = Math.random() * 3 + 2;
    ctx.beginPath();
    ctx.moveTo(0, Math.random() * 80);
    ctx.lineTo(200, Math.random() * 80);
    ctx.stroke();
  }

  return new Response(canvas.toBuffer('image/png'), {
    headers: {
      'Content-Type': 'image/png',
    },
  });
};
