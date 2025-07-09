import type { RequestHandler } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import prisma from '$lib/prisma';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Unauthorized');
  }
  
  // Check if user has seller or admin role
  const canUpload = user.role?.includes('SELLER') || user.role?.includes('ADMIN');
  if (!canUpload) {
    throw error(403, 'Forbidden - Seller access required');
  }

  try {
    const formData = await request.formData();
    const content = formData.get('content') as string;
    const splitter = formData.get('splitter') as string;
    const fieldMappingsStr = formData.get('fieldMappings') as string;
    
    if (!content || !content.trim()) {
      throw error(400, 'No content provided');
    }

    const fieldMappings = JSON.parse(fieldMappingsStr);
    
    // Validate required fields are mapped
    const requiredFields = ['cardNumber', 'expMonth', 'expYear', 'cvv'];
    for (const field of requiredFields) {
      if (fieldMappings[field] === -1) {
        throw error(400, `Required field ${field} is not mapped`);
      }
    }

    // Parse content into rows
    const lines = content.trim().split('\n').filter(line => line.trim());
    const cardsToCreate = [];

    for (const line of lines) {
      const columns = line.split(splitter);
      
      // Skip if not enough columns
      if (columns.length <= Math.max(...(Object.values(fieldMappings).filter(v => v !== -1) as number[]))) {
        continue;
      }

      // Extract data based on field mappings
      const cardData: any = {
        sellerId: user.id,
        price: 0.5, // Default price
        isRefundable: false,
        isDiscounted: false,
        isChecked: false,
        status: 'UNCHECKED'
      };

      // Map required fields
      cardData.cardNumber = columns[fieldMappings.cardNumber]?.trim() || '';
      cardData.expMonth = columns[fieldMappings.expMonth]?.trim() || '';
      cardData.expYear = columns[fieldMappings.expYear]?.trim() || '';
      cardData.cvv = columns[fieldMappings.cvv]?.trim() || '';

      // Map optional fields
      const optionalFields = [
        'fullName', 'firstName', 'lastName', 'address', 'city', 'state', 
        'zip', 'country', 'phone', 'email', 'ssn', 'dob', 'mmn', 'dl', 
        'sortCode', 'atmPin', 'carrierPin', 'cardBalance', 'userAgent', 'ip'
      ];

      for (const field of optionalFields) {
        if (fieldMappings[field] !== -1 && columns[fieldMappings[field]]) {
          cardData[field] = columns[fieldMappings[field]].trim();
        }
      }

      // Basic validation
      if (!cardData.cardNumber || !cardData.expMonth || !cardData.expYear || !cardData.cvv) {
        continue; // Skip invalid rows
      }

      // Validate card number (13-19 digits)
      if (!/^\d{13,19}$/.test(cardData.cardNumber.replace(/\s/g, ''))) {
        continue;
      }

      // Validate expiry
      if (!/^\d{1,2}$/.test(cardData.expMonth) || !/^\d{2,4}$/.test(cardData.expYear)) {
        continue;
      }

      // Validate CVV
      if (!/^\d{3,4}$/.test(cardData.cvv)) {
        continue;
      }

      // Normalize card number (remove spaces)
      cardData.cardNumber = cardData.cardNumber.replace(/\s/g, '');

      // Normalize expiry year (ensure 4 digits)
      if (cardData.expYear.length === 2) {
        const year = parseInt(cardData.expYear);
        cardData.expYear = year > 50 ? `19${cardData.expYear}` : `20${cardData.expYear}`;
      }

      cardsToCreate.push(cardData);
    }

    if (cardsToCreate.length === 0) {
      throw error(400, 'No valid card data found');
    }

    // Batch insert cards
    const result = await prisma.creditCard.createMany({
      data: cardsToCreate,
      skipDuplicates: true
    });

    return json({
      success: true,
      count: result.count,
      message: `Successfully uploaded ${result.count} cards`
    });

  } catch (err: any) {
    console.error('Upload error:', err);
    
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    throw error(500, err.message || 'Internal server error');
  }
};
