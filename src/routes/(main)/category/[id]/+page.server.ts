import { ProductTags, ProductType } from '@prisma/client';
import type { PageServerLoad } from './$types';
import prisma from '$lib/prisma';
import { redirect } from '@sveltejs/kit';

const PER_PAGE = 3;

export const load: PageServerLoad = async ({ parent, url, params }) => {
  const page = Number(url.searchParams.get('page')) || 1;
  const category = await prisma.category
    .findUnique({
      where: {
        id: Number(params.id),
      },
      select: {
        id: true,
        name: true,
        products: {
          take: PER_PAGE,
          skip: (page - 1) * PER_PAGE,
          where: {
            NOT: {
              tags: {
                has: ProductTags.DELETED,
              },
            },
          },
          select: {
            id: true,
            name: true,
            stock: true,
            type: true,
            price: true,
            seller: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    })
    .then((category) => ({
      ...category,
      products: category?.products.map((product) => ({
        ...product,
        stock: product.type == ProductType.DOWNLOAD ? '∞' : product.stock.split('\n').length,
      })),
    }));

  const pages = await prisma.product
    .count({
      where: {
        category: {
          id: Number(params.id),
        },
        NOT: {
          tags: {
            has: ProductTags.DELETED,
          },
        },
      },
    })
    .then((count) => Math.ceil(count / PER_PAGE));

  if (!category) throw redirect(302, '/');

  return {
    category,
    pages,
    page,
  };
};
