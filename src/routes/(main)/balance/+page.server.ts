import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import prisma from '$lib/prisma';
import { userFromToken } from '$lib/util';

export const actions: Actions = {
  async topUp({ request, cookies, url }) {
    const user = userFromToken(cookies.get('token'));
    if (!user?.id) return fail(401, { error: 'auth' });

    const body = await request.formData();
    const amount = Number(body.get('amount'));
    if (amount < 10 || amount > 100_000) {
      return fail(400, { error: 'amount' });
    }

    if (typeof process.env.NOWPAYMENTS_API_KEY !== 'string') return fail(500, { error: 'server' });
    const payment = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: 'USD',
        success_url: `${url.protocol}//${url.host}/balance/success`,
        cancel_url: `${url.protocol}//${url.host}/balance/cancel`,
      }),
    }).then((res) => res.json());

    if (!payment.invoice_url) return fail(500, { error: 'server' });

    await prisma.topUp.create({
      data: {
        amount,
        user: {
          connect: {
            id: user.id,
          },
        },
        reference: payment.id,
      },
    });

    throw redirect(302, payment.invoice_url);
  },
};
