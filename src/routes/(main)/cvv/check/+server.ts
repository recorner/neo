import type { RequestHandler } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import prisma from '$lib/prisma';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Unauthorized');
  }

  try {
    const { cardId } = await request.json();
    
    if (!cardId) {
      throw error(400, 'Card ID is required');
    }

    // Check if user has sufficient balance
    if (user.balance < 0.5) {
      throw error(400, 'Insufficient balance. You need at least $0.50 to check a card.');
    }

    // Get the card
    const card = await prisma.creditCard.findUnique({
      where: { id: parseInt(cardId) }
    });

    if (!card) {
      throw error(404, 'Card not found');
    }

    // Check if card was already checked by this user
    const existingCheck = await prisma.cardCheck.findFirst({
      where: {
        cardId: card.id,
        checkerId: user.id
      }
    });

    if (existingCheck) {
      throw error(400, 'You have already checked this card');
    }

    // Simulate card checking (randomized result for demo)
    // In production, this would integrate with a real card checking service
    const isLive = Math.random() > 0.7; // 30% chance of being live
    const result = isLive ? 'LIVE' : 'DEAD';

    // Start transaction
    const [updatedUser, updatedCard, cardCheck] = await prisma.$transaction([
      // Deduct balance from user
      prisma.user.update({
        where: { id: user.id },
        data: {
          balance: {
            decrement: 0.5
          }
        }
      }),
      
      // Update card status if first check
      prisma.creditCard.update({
        where: { id: card.id },
        data: {
          status: result,
          isChecked: true,
          checkedAt: new Date(),
          checkedById: user.id
        }
      }),
      
      // Create check record
      prisma.cardCheck.create({
        data: {
          cardId: card.id,
          checkerId: user.id,
          result: result,
          cost: 0.5
        }
      })
    ]);

    return json({
      success: true,
      status: result,
      newBalance: updatedUser.balance,
      checkId: cardCheck.id
    });

  } catch (err: any) {
    console.error('Card check error:', err);
    
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    throw error(500, err.message || 'Internal server error');
  }
};
