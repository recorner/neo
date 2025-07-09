import type { RequestHandler } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import prisma from '$lib/prisma';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Unauthorized');
  }

  const cardId = parseInt(params.id);
  if (!cardId) {
    throw error(400, 'Invalid card ID');
  }

  try {
    // Get the card first
    const card = await prisma.creditCard.findUnique({
      where: { id: cardId }
    });

    if (!card) {
      throw error(404, 'Card not found');
    }

    // Check permissions - only admin or card owner can delete
    const isAdmin = user.role?.includes('ADMIN');
    const isOwner = card.sellerId === user.id;

    if (!isAdmin && !isOwner) {
      throw error(403, 'You can only delete your own cards');
    }

    // Check if card has been checked - prevent deletion if it has checks
    const hasChecks = await prisma.cardCheck.findFirst({
      where: { cardId: card.id }
    });

    if (hasChecks && !isAdmin) {
      throw error(400, 'Cannot delete a card that has been checked');
    }

    // Delete the card (and related checks due to cascade)
    await prisma.creditCard.delete({
      where: { id: cardId }
    });

    return json({
      success: true,
      message: 'Card deleted successfully'
    });

  } catch (err: any) {
    console.error('Delete card error:', err);
    
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    throw error(500, err.message || 'Internal server error');
  }
};
