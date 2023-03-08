import prisma from '$lib/prisma';
import { ProductTags } from '@prisma/client';
import type { Actions, PageServerLoad } from './$types';
import { userFromToken } from '$lib/util';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  const products = await prisma.product.findMany({
    where: {
      seller: {
        id: user.id,
      },
      NOT: {
        tags: {
          has: ProductTags.DELETED,
        },
      },
    },
    select: {
      name: true,
      cartEntries: {
        where: {
          createdAt: {
            gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          quantity: true,
        },
      },
    },
  });

  const sales = products.reduce((acc, product) => {
    return (
      acc +
      product.cartEntries.reduce((acc, cartEntry) => {
        return acc + cartEntry.quantity;
      }, 0)
    );
  }, 0);

  const salesByProduct = products
    .map((product) => {
      return {
        name: product.name,
        value: product.cartEntries.reduce((acc, cartEntry) => {
          return acc + cartEntry.quantity;
        }, 0),
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    sales,
    salesByProduct,
  };
};

export const actions: Actions = {
  async payout({ cookies, request }) {
    const user = userFromToken(cookies.get('token'));
    if (!user) return fail(401, { error: 'unauthorized' });

    const body = await request.formData();
    const amount = Number(body.get('amount'));

    // ^[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93}$
    const address = body.get('address') as string;
    if (!address || !/^[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/.test(address)) return fail(400, { error: 'address' });

    const seller = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        balance: true,
      },
    });

    if (!seller || seller.balance < amount) return fail(400, { error: 'insufficient' });

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });

    const payout = await prisma.payout.create({
      data: {
        address,
        amount,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    if (!payout) return fail(500, { error: 'internal' });

    return { success: true };
  },
};
