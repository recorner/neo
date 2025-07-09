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

  // calculate sales per day
  const allSales = await prisma.cartEntry.findMany({
    where: {
      product: {
        seller: {
          id: user.id,
        },
      },
      createdAt: {
        gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    select: {
      productId: true,
      createdAt: true,
      quantity: true,
    },
  });

  const salesPerDay = allSales.reduce((acc, cartEntry) => {
    const date = new Date(cartEntry.createdAt).toLocaleDateString('en-GB');
    if (!acc[date]) acc[date] = 0;
    acc[date] += cartEntry.quantity;
    return acc;
  }, {} as Record<string, number>);

  // CVV Stats
  let cvvStats = {
    totalCards: 0,
    checkedCards: 0,
    liveCards: 0,
    totalRevenue: 0
  };
  
  let recentCards: any[] = [];
  let recentChecks: any[] = [];

  try {
    // Get CVV stats
    const [
      totalCards,
      checkedCards,
      liveCards,
      totalRevenue
    ] = await Promise.all([
      // Total cards uploaded by seller
      prisma.creditCard.count({
        where: { sellerId: user.id }
      }),
      
      // Checked cards
      prisma.creditCard.count({
        where: {
          sellerId: user.id,
          isChecked: true
        }
      }),
      
      // Live cards
      prisma.creditCard.count({
        where: {
          sellerId: user.id,
          status: 'LIVE'
        }
      }),
      
      // Total revenue from card checks
      prisma.cardCheck.aggregate({
        where: {
          card: { sellerId: user.id }
        },
        _sum: {
          cost: true
        }
      })
    ]);

    cvvStats = {
      totalCards,
      checkedCards,
      liveCards,
      totalRevenue: totalRevenue._sum.cost || 0
    };

    // Get recent cards
    recentCards = await prisma.creditCard.findMany({
      where: { sellerId: user.id },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        cardNumber: true,
        country: true,
        status: true,
        price: true,
        createdAt: true
      }
    });

    // Get recent checks on seller's cards
    recentChecks = await prisma.cardCheck.findMany({
      where: {
        card: { sellerId: user.id }
      },
      include: {
        card: {
          select: {
            cardNumber: true
          }
        },
        checker: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

  } catch (error) {
    console.error('Error loading CVV data:', error);
  }

  return {
    sales,
    salesByProduct,
    salesPerDay,
    cvvStats,
    recentCards,
    recentChecks,
  };
};

export const actions: Actions = {
  async payout({ cookies, request }) {
    const user = userFromToken(cookies.get('__token'));
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
  async contact({ cookies, request }) {
    const user = userFromToken(cookies.get('__token'));
    if (!user) return fail(401, { error: 'unauthorized' });

    const body = await request.formData();
    let telegram = body.get('telegram') as string;
    if (!telegram) return fail(400, { error: 'missing' });

    if (telegram[0] === '@') telegram = telegram.slice(1);

    const contact = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        telegram,
      },
    });

    if (!contact) return fail(500, { error: 'internal' });

    return { success: true };
  },
};
