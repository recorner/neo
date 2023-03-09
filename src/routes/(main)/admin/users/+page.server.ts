import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

const PER_PAGE = 10;

export const load: PageServerLoad = async ({ url }) => {
  const page = Number(url.searchParams.get('page')) || 1;

  const users = await prisma.user.findMany({
    take: PER_PAGE,
    skip: (page - 1) * PER_PAGE,
    select: {
      id: true,
      username: true,
      role: true,
      balance: true,
      createdAt: true,
    },
  });

  const pages = await prisma.user.count().then((count) => Math.ceil(count / PER_PAGE));

  return {
    pages,
    page,
    users,
  };
};
