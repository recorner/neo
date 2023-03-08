import prisma from '$lib/prisma';
import { ProductTags, ProductType } from '@prisma/client';
import type { PageServerLoad } from './$types';
import { stockCount } from '$lib/util';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  const products = await prisma.product
    .findMany({
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
        id: true,
        name: true,
        price: true,
        stock: true,
        type: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    })
    .then((products) =>
      products.map((product) => ({
        ...product,
        stock: product.type == ProductType.DOWNLOAD ? '∞' : stockCount(product.stock),
      }))
    );

  return {
    products,
  };
};
