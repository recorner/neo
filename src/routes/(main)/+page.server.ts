import prisma from '$lib/prisma';
import { ProductTags, ProductType } from '@prisma/client';
import type { PageServerLoad } from './$types';
import { stockCount } from '$lib/util';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  // Get user's order count
  const orders = await prisma.order.count({
    where: {
      buyer: {
        id: user.id,
      },
    },
  });

  // Get latest announcements
  const announcements = await prisma.announcement.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
    select: {
      id: true,
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

  // Get featured/trending products - you can modify this logic
  const featuredProducts = await prisma.product.findMany({
    where: {
      NOT: {
        tags: {
          has: ProductTags.DELETED,
        },
      },
    },
    orderBy: [
      { createdAt: 'desc' }
    ],
    take: 8,
    select: {
      id: true,
      name: true,
      shortDesc: true,
      price: true,
      stock: true,
      type: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      seller: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  }).then((products) =>
    products.map((product) => ({
      ...product,
      stock: product.type === ProductType.DOWNLOAD ? '∞' : stockCount(product.stock),
    }))
  );

  // Get top-selling products (based on order count)
  const topSellingProducts = await prisma.product.findMany({
    where: {
      NOT: {
        tags: {
          has: ProductTags.DELETED,
        },
      },
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      seller: {
        select: {
          id: true,
          username: true,
        },
      },
      cartEntries: {
        where: {
          order: {
            status: 'PAID',
          },
        },
        select: {
          quantity: true,
        },
      },
    },
    take: 20,
  }).then((products) => {
    // Calculate total sales and sort by popularity
    const withSales = products.map((product) => ({
      id: product.id,
      name: product.name,
      shortDesc: product.shortDesc,
      price: product.price,
      stock: product.type === ProductType.DOWNLOAD ? '∞' : stockCount(product.stock),
      type: product.type,
      category: product.category,
      seller: product.seller,
      totalSales: product.cartEntries.reduce((sum, entry) => sum + entry.quantity, 0),
    }));

    return withSales
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 6);
  });

  // Get recent products
  const recentProducts = await prisma.product.findMany({
    where: {
      NOT: {
        tags: {
          has: ProductTags.DELETED,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 6,
    select: {
      id: true,
      name: true,
      shortDesc: true,
      price: true,
      stock: true,
      type: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      seller: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  }).then((products) =>
    products.map((product) => ({
      ...product,
      stock: product.type === ProductType.DOWNLOAD ? '∞' : stockCount(product.stock),
    }))
  );

  // Get categories with product counts
  const categoriesWithCounts = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      _count: {
        select: {
          products: {
            where: {
              NOT: {
                tags: {
                  has: ProductTags.DELETED,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  }).then((categories) =>
    categories.map((category) => ({
      ...category,
      image: category.image ? `${process.env.UPLOAD_PREFIX}/${category.image}` : null,
      productCount: category._count.products,
    }))
  );

  return {
    user,
    orders,
    announcements,
    featuredProducts,
    topSellingProducts,
    recentProducts,
    categoriesWithCounts,
  };
};
