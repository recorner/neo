import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw redirect(302, '/auth/login');
  }

  // Only sellers and admins can access this page
  if (!user.role?.includes('SELLER') && !user.role?.includes('ADMIN')) {
    throw redirect(302, '/');
  }

  try {
    // Get seller's card statistics
    const [
      totalCards,
      liveCards,
      deadCards,
      uncheckedCards,
      recentCards,
      recentChecks,
      totalEarnings
    ] = await Promise.all([
      // Total cards
      prisma.creditCard.count({
        where: { sellerId: user.id }
      }),
      
      // Live cards
      prisma.creditCard.count({
        where: { 
          sellerId: user.id,
          status: 'LIVE'
        }
      }),
      
      // Dead cards
      prisma.creditCard.count({
        where: { 
          sellerId: user.id,
          status: 'DEAD'
        }
      }),
      
      // Unchecked cards
      prisma.creditCard.count({
        where: { 
          sellerId: user.id,
          status: 'UNCHECKED'
        }
      }),
      
      // Recent cards (last 10)
      prisma.creditCard.findMany({
        where: { sellerId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          cardNumber: true,
          expMonth: true,
          expYear: true,
          country: true,
          price: true,
          status: true,
          createdAt: true
        }
      }),
      
      // Recent checks on seller's cards
      prisma.cardCheck.findMany({
        where: {
          card: {
            sellerId: user.id
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
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
        }
      }),
      
      // Total earnings from card checks
      prisma.cardCheck.aggregate({
        where: {
          card: {
            sellerId: user.id
          }
        },
        _sum: {
          cost: true
        }
      })
    ]);

    const stats = {
      totalCards,
      liveCards,
      deadCards,
      uncheckedCards,
      totalEarnings: totalEarnings._sum.cost || 0
    };

    return {
      user,
      stats,
      recentCards,
      recentChecks
    };

  } catch (error) {
    console.error('Error loading CVV dashboard:', error);
    return {
      user,
      stats: {
        totalCards: 0,
        liveCards: 0,
        deadCards: 0,
        uncheckedCards: 0,
        totalEarnings: 0
      },
      recentCards: [],
      recentChecks: []
    };
  }
};
