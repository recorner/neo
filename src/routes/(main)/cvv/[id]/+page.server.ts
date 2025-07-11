import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { CardStatus } from '@prisma/client';

export const load: PageServerLoad = async ({ params }) => {
  const cardId = parseInt(params.id);
  
  if (!cardId) {
    throw error(400, 'Invalid card ID');
  }

  const card = await prisma.creditCard.findUnique({
    where: {
      id: cardId,
      status: CardStatus.LIVE // Only show live cards to customers
    },
    select: {
      id: true,
      cardNumber: true,
      expMonth: true,
      expYear: true,
      cvv: true,
      fullName: true,
      country: true,
      state: true,
      zip: true,
      price: true,
      status: true,
      isDiscounted: true,
      createdAt: true,
      seller: {
        select: {
          id: true,
          username: true,
        },
      },
    }
  });

  if (!card) {
    throw error(404, 'Card not found or not available');
  }

  return {
    card
  };
};
