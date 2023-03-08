import prisma from '$lib/prisma';
import { PayoutStatus, Role } from '@prisma/client';
import type { Actions, PageServerLoad } from './$types';
import { userFromToken } from '$lib/util';
import { fail } from '@sveltejs/kit';

const PER_PAGE = 10;

export const load: PageServerLoad = async ({ url }) => {
  const pendingPayouts = await prisma.payout.count({
    where: {
      status: PayoutStatus.PENDING,
    },
  });

  const page = Number(url.searchParams.get('page')) || 1;

  const payouts = await prisma.payout.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
    select: {
      id: true,
      address: true,
      amount: true,
      createdAt: true,
      status: true,
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  const pages = await prisma.payout.count().then((count) => Math.ceil(count / PER_PAGE));

  return {
    pendingPayouts,
    pages,
    page,
    payouts,
  };
};

export const actions: Actions = {
  async approve({ cookies, request }) {
    const user = userFromToken(cookies.get('token'));
    if (!user || !user.role.includes(Role.ADMIN)) return fail(401, { error: 'unauthorized' });

    const body = await request.formData();

    const payout = await prisma.payout.findUnique({
      where: {
        id: Number(body.get('id')),
      },
      select: {
        id: true,
      },
    });

    if (!payout) return fail(404, { error: 'not found' });

    await prisma.payout.update({
      where: {
        id: payout.id,
      },
      data: {
        status: PayoutStatus.COMPLETED,
        paidAt: new Date(),
      },
    });

    return { success: true };
  },
};
