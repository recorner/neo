import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only sellers and admins can upload
  if (!user.role?.includes('SELLER') && !user.role?.includes('ADMIN')) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { content, splitter, fieldMappings } = await request.json();
    
    if (!content || !Array.isArray(content) || content.length === 0) {
      return json({ error: 'No content provided' }, { status: 400 });
    }

    // Validate required field mappings
    if (fieldMappings.cardNumber === -1 || fieldMappings.expMonth === -1 || 
        fieldMappings.expYear === -1 || fieldMappings.cvv === -1) {
      return json({ error: 'Required fields not mapped' }, { status: 400 });
    }

    const cardsToInsert = [];
    const errors = [];

    for (let i = 0; i < content.length; i++) {
      try {
        const line = content[i].trim();
        if (!line) continue;

        const fields = line.split(splitter);
        
        // Extract required fields
        const cardNumber = fields[fieldMappings.cardNumber]?.trim();
        const expMonth = fields[fieldMappings.expMonth]?.trim();
        const expYear = fields[fieldMappings.expYear]?.trim();
        const cvv = fields[fieldMappings.cvv]?.trim();

        // Validate required fields
        if (!cardNumber || !expMonth || !expYear || !cvv) {
          errors.push(`Line ${i + 1}: Missing required fields`);
          continue;
        }

        // Validate card number (basic check)
        if (!/^\d{13,19}$/.test(cardNumber)) {
          errors.push(`Line ${i + 1}: Invalid card number format`);
          continue;
        }

        // Validate expiry month
        const monthNum = parseInt(expMonth);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
          errors.push(`Line ${i + 1}: Invalid expiry month`);
          continue;
        }

        // Validate expiry year
        let yearNum = parseInt(expYear);
        if (expYear.length === 2) {
          yearNum = 2000 + yearNum;
        }
        if (isNaN(yearNum) || yearNum < 2024 || yearNum > 2040) {
          errors.push(`Line ${i + 1}: Invalid expiry year`);
          continue;
        }

        // Validate CVV
        if (!/^\d{3,4}$/.test(cvv)) {
          errors.push(`Line ${i + 1}: Invalid CVV format`);
          continue;
        }

        // Build card object
        const cardData: any = {
          cardNumber,
          expMonth: monthNum.toString().padStart(2, '0'),
          expYear: yearNum.toString(),
          cvv,
          sellerId: user.id,
          price: 2.0, // Default price, can be changed later
        };

        // Add optional fields if mapped
        if (fieldMappings.fullName !== -1 && fields[fieldMappings.fullName]) {
          cardData.fullName = fields[fieldMappings.fullName].trim();
        }
        if (fieldMappings.firstName !== -1 && fields[fieldMappings.firstName]) {
          cardData.firstName = fields[fieldMappings.firstName].trim();
        }
        if (fieldMappings.lastName !== -1 && fields[fieldMappings.lastName]) {
          cardData.lastName = fields[fieldMappings.lastName].trim();
        }
        if (fieldMappings.address !== -1 && fields[fieldMappings.address]) {
          cardData.address = fields[fieldMappings.address].trim();
        }
        if (fieldMappings.city !== -1 && fields[fieldMappings.city]) {
          cardData.city = fields[fieldMappings.city].trim();
        }
        if (fieldMappings.state !== -1 && fields[fieldMappings.state]) {
          cardData.state = fields[fieldMappings.state].trim();
        }
        if (fieldMappings.zip !== -1 && fields[fieldMappings.zip]) {
          cardData.zip = fields[fieldMappings.zip].trim();
        }
        if (fieldMappings.country !== -1 && fields[fieldMappings.country]) {
          cardData.country = fields[fieldMappings.country].trim();
        }
        if (fieldMappings.phone !== -1 && fields[fieldMappings.phone]) {
          cardData.phone = fields[fieldMappings.phone].trim();
        }
        if (fieldMappings.email !== -1 && fields[fieldMappings.email]) {
          cardData.email = fields[fieldMappings.email].trim();
        }
        if (fieldMappings.ssn !== -1 && fields[fieldMappings.ssn]) {
          cardData.ssn = fields[fieldMappings.ssn].trim();
        }
        if (fieldMappings.dob !== -1 && fields[fieldMappings.dob]) {
          cardData.dob = fields[fieldMappings.dob].trim();
        }
        if (fieldMappings.mmn !== -1 && fields[fieldMappings.mmn]) {
          cardData.mmn = fields[fieldMappings.mmn].trim();
        }
        if (fieldMappings.dl !== -1 && fields[fieldMappings.dl]) {
          cardData.dl = fields[fieldMappings.dl].trim();
        }
        if (fieldMappings.sortCode !== -1 && fields[fieldMappings.sortCode]) {
          cardData.sortCode = fields[fieldMappings.sortCode].trim();
        }
        if (fieldMappings.atmPin !== -1 && fields[fieldMappings.atmPin]) {
          cardData.atmPin = fields[fieldMappings.atmPin].trim();
        }
        if (fieldMappings.carrierPin !== -1 && fields[fieldMappings.carrierPin]) {
          cardData.carrierPin = fields[fieldMappings.carrierPin].trim();
        }
        if (fieldMappings.cardBalance !== -1 && fields[fieldMappings.cardBalance]) {
          cardData.cardBalance = fields[fieldMappings.cardBalance].trim();
        }
        if (fieldMappings.userAgent !== -1 && fields[fieldMappings.userAgent]) {
          cardData.userAgent = fields[fieldMappings.userAgent].trim();
        }
        if (fieldMappings.ip !== -1 && fields[fieldMappings.ip]) {
          cardData.ip = fields[fieldMappings.ip].trim();
        }

        cardsToInsert.push(cardData);
      } catch (error) {
        errors.push(`Line ${i + 1}: ${error.message}`);
      }
    }

    if (cardsToInsert.length === 0) {
      return json({ 
        error: 'No valid cards to upload', 
        details: errors 
      }, { status: 400 });
    }

    // Insert cards in batches to avoid timeout
    const batchSize = 100;
    let uploadedCount = 0;
    
    for (let i = 0; i < cardsToInsert.length; i += batchSize) {
      const batch = cardsToInsert.slice(i, i + batchSize);
      
      try {
        await prisma.creditCard.createMany({
          data: batch,
          skipDuplicates: true
        });
        uploadedCount += batch.length;
      } catch (batchError) {
        console.error('Batch insert error:', batchError);
        // Continue with next batch
      }
    }

    return json({
      success: true,
      uploaded: uploadedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Upload error:', error);
    return json({ error: 'Upload failed' }, { status: 500 });
  }
};
