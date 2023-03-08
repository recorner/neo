import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  const products = await prisma.product.findMany({
    where: {
      seller: {
        id: user.id,
      },
    },
  });

  return {
    products,
  };
};
