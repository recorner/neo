import prisma from '$lib/prisma';
import { json, type RequestHandler } from '@sveltejs/kit';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ request }) => {
  if (!process.env.NOWPAYMENTS_IPN_SECRET) return json({ error: 'ipn secret' }, { status: 500 });

  const body = await request.json();
  const hmac = crypto.createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET);
  hmac.update(JSON.stringify(body, Object.keys(body).sort()));
  const signature = hmac.digest('hex');
  if (signature !== request.headers.get('x-nowpayments-sig')) return json({ error: 'signature' }, { status: 500 });

  if (body.status == 'confirmed') {
    const topUp = await prisma.topUp.findUnique({
      where: {
        reference: body.payment_id,
      },
      select: {
        id: true,
        amount: true,
        completed: true,
        userId: true,
      },
    });

    if (!topUp || topUp.completed) return json({ ok: true });

    await prisma.topUp.update({
      where: {
        id: topUp.id,
      },
      data: {
        completed: true,
      },
    });

    await prisma.user.update({
      where: {
        id: topUp.userId,
      },
      data: {
        balance: {
          increment: topUp.amount,
        },
      },
    });
  }

  return json({ ok: true });
};
