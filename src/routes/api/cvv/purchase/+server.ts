import type { RequestHandler } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { CardStatus } from '@prisma/client';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Unauthorized');
  }

  const { cardId } = await request.json();
  
  if (!cardId) {
    throw error(400, 'Card ID is required');
  }

  try {
    // Get the card details
    const card = await prisma.creditCard.findUnique({
      where: { 
        id: cardId,
        status: CardStatus.LIVE
      }
    });

    if (!card) {
      throw error(404, 'Card not found or not available');
    }

    // Check if user has enough balance
    if (user.balance < card.price) {
      throw error(400, 'Insufficient balance');
    }

    // Check if user already purchased this card
    const existingPurchase = await prisma.cardCheck.findFirst({
      where: {
        cardId: card.id,
        checkerId: user.id
      }
    });

    if (existingPurchase) {
      return json({
        success: true,
        message: 'Card already purchased',
        remainingBalance: user.balance,
        alreadyPurchased: true
      });
    }

    // Process the purchase in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct money from buyer
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          balance: {
            decrement: card.price
          }
        }
      });

      // Add money to seller
      await tx.user.update({
        where: { id: card.sellerId },
        data: {
          balance: {
            increment: card.price
          }
        }
      });

      // Create purchase record
      await tx.cardCheck.create({
        data: {
          cardId: card.id,
          checkerId: user.id,
          result: CardStatus.LIVE, // Use existing status
          cost: card.price
        }
      });

      return updatedUser;
    });

    return json({
      success: true,
      message: 'Card purchased successfully',
      remainingBalance: result.balance
    });

  } catch (err: any) {
    console.error('Purchase error:', err);
    
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    throw error(500, err.message || 'Internal server error');
  }
};
