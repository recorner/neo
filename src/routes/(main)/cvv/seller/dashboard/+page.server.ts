import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw redirect(302, '/auth/login');
  }
  
  // Check if user has seller or admin role
  const canAccess = user.role?.includes('SELLER') || user.role?.includes('ADMIN');
  if (!canAccess) {
    throw redirect(302, '/cvv');
  }

  const isAdmin = user.role?.includes('ADMIN');
  const sellerId = isAdmin ? undefined : user.id;

  try {
    // Get stats
    const [
      totalCards,
      checkedCards,
      liveCards,
      totalRevenue
    ] = await Promise.all([
      // Total cards uploaded by seller
      prisma.creditCard.count({
        where: sellerId ? { sellerId } : {}
      }),
      
      // Checked cards
      prisma.creditCard.count({
        where: {
          ...(sellerId ? { sellerId } : {}),
          isChecked: true
        }
      }),
      
      // Live cards
      prisma.creditCard.count({
        where: {
          ...(sellerId ? { sellerId } : {}),
          status: 'LIVE'
        }
      }),
      
      // Total revenue from card checks
      prisma.cardCheck.aggregate({
        where: {
          card: sellerId ? { sellerId } : {}
        },
        _sum: {
          cost: true
        }
      })
    ]);

    // Get recent cards
    const recentCards = await prisma.creditCard.findMany({
      where: sellerId ? { sellerId } : {},
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Get recent checks on seller's cards
    const recentChecks = await prisma.cardCheck.findMany({
      where: {
        card: sellerId ? { sellerId } : {}
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
      take: 10
    });

    return {
      user,
      stats: {
        totalCards,
        checkedCards,
        liveCards,
        totalRevenue: totalRevenue._sum.cost || 0
      },
      recentCards,
      recentChecks
    };

  } catch (error) {
    console.error('Error loading seller dashboard:', error);
    return {
      user,
      stats: {
        totalCards: 0,
        checkedCards: 0,
        liveCards: 0,
        totalRevenue: 0
      },
      recentCards: [],
      recentChecks: []
    };
  }
};
