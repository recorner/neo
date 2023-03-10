import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  const orders = await prisma.order.count({
    where: {
      buyer: {
        id: user.id,
      },
    },
  });

  const announcements = await prisma.announcement.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      title: true,
      body: true,
      createdAt: true,
      poster: {
        select: {
          username: true,
        },
      },
    },
  });

  return {
    orders,
    announcements,
  };
};
