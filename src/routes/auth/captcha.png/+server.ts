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

export const GET: RequestHandler = async ({ cookies, url }) => {
  let code = crypto.randomBytes(3).toString('hex');
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

  // draw random lines
  for (let i = 0; i < Math.random() * 5 + 10; i++) {
    // random color
    ctx.strokeStyle = randomColor();
    ctx.lineWidth = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 200, Math.random() * 80);
    ctx.lineTo(Math.random() * 200, Math.random() * 80);
    ctx.stroke();
  }

  ctx.font = Math.random() * 5 + 45 + 'px ' + fonts[Math.floor(Math.random() * fonts.length)];
  ctx.rotate(Math.random() * 0.1 - 0.05);
  ctx.fillStyle =
    'hsl(' + Math.random() * 360 + ', ' + (Math.random() * 10 + 45) + '%, ' + (Math.random() * 10 + 45) + '%)';
  ctx.fillText(code, Math.random() * 10, Math.random() * 20 + 50);

  // draw 2 lines that go through the entire image
  for (let i = 0; i < 2; i++) {
    ctx.strokeStyle = randomColor();
    ctx.lineWidth = Math.random() * 3 + 2;
    ctx.beginPath();
    ctx.moveTo(0, Math.random() * 80);
    ctx.lineTo(200, Math.random() * 80);
    ctx.stroke();
  }

  // create a bunch of other random letters
  for (let i = 0; i < Math.random() * 10 + 20; i++) {
    ctx.font = Math.random() * 20 + 20 + 'px ' + fonts[Math.floor(Math.random() * fonts.length)];
    ctx.rotate(Math.random() * 0.4 - 0.2);
    ctx.fillStyle = randomColor().replace('rgb', 'rgba').replace(')', ', 0.1)');
    ctx.fillText(crypto.randomBytes(1).toString('hex'), Math.random() * 200, Math.random() * 50 + 30);
  }

  // draw random circles
  for (let i = 0; i < Math.random() * 20 + 20; i++) {
    ctx.strokeStyle = randomColor();
    ctx.lineWidth = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.arc(Math.random() * 200, Math.random() * 80, Math.random() * 10, 0, Math.random() * 2 * Math.PI);
    ctx.stroke();
  }

  return new Response(canvas.toBuffer('image/png'), {
    headers: {
      'Content-Type': 'image/png',
    },
  });
};
