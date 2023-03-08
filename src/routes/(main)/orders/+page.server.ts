import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  const orders = prisma.order.findMany({
    where: {
      buyer: {
        id: user.id,
      },
    },
    select: {
      id: true,
      createdAt: true,
      cart: {
        select: {
          delivered: true,
          quantity: true,
          product: {
            select: {
              name: true,
              price: true,
              seller: {
                select: {
                  username: true,
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return { orders };
};
