import prisma from '$lib/prisma';
import { json, type RequestHandler } from '@sveltejs/kit';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  // Verify IPN secret is configured
  if (!process.env.NOWPAYMENTS_IPN_SECRET) {
    console.error('NOWPAYMENTS_IPN_SECRET not configured');
    return json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const body = await request.json();
    
    // Verify HMAC signature
    const hmac = crypto.createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET);
    hmac.update(JSON.stringify(body, Object.keys(body).sort()));
    const signature = hmac.digest('hex');
    const receivedSignature = request.headers.get('x-nowpayments-sig');
    
    if (signature !== receivedSignature) {
      console.error('Invalid IPN signature', {
        expected: signature,
        received: receivedSignature,
        clientIP: getClientAddress(),
      });
      return json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Log the IPN for debugging
    console.log('Received valid IPN:', {
      payment_id: body.payment_id,
      payment_status: body.payment_status,
      order_id: body.order_id,
      timestamp: new Date().toISOString(),
    });

    // Process confirmed payments
    if (body.payment_status === 'confirmed') {
      const topUp = await prisma.topUp.findUnique({
        where: {
          reference: body.payment_id ? body.payment_id.toString() : body.invoice_id,
        },
        select: {
          id: true,
          amount: true,
          completed: true,
          userId: true,
        },
      });

      if (!topUp) {
        console.error('TopUp not found for payment:', body.payment_id || body.invoice_id);
        return json({ error: 'Payment not found' }, { status: 404 });
      }

      if (topUp.completed) {
        console.log('Payment already processed:', topUp.id);
        return json({ ok: true, message: 'Already processed' });
      }

      // Update topUp and user balance in transaction
      await prisma.$transaction([
        prisma.topUp.update({
          where: { id: topUp.id },
          data: { 
            completed: true,
            status: 'confirmed'
          },
        }),
        prisma.user.update({
          where: { id: topUp.userId },
          data: {
            balance: { increment: topUp.amount },
          },
        }),
      ]);

      console.log('Payment processed successfully:', {
        topUpId: topUp.id,
        userId: topUp.userId,
        amount: topUp.amount,
      });

      // TODO: Emit event for real-time updates (WebSocket/Redis pub-sub)
      // This can be used for Telegram bot integration in the future
    }

    // Handle other payment statuses
    if (['failed', 'expired', 'refunded'].includes(body.payment_status)) {
      console.log('Payment failed/expired/refunded:', {
        payment_id: body.payment_id,
        status: body.payment_status,
        reason: body.outcome?.reason || 'N/A',
      });

      // Update the payment status in database
      const paymentId = body.payment_id ? body.payment_id.toString() : body.invoice_id;
      await prisma.topUp.updateMany({
        where: {
          reference: paymentId,
          completed: false, // Only update if not already completed
        },
        data: {
          status: body.payment_status,
        },
      });

      console.log(`Updated payment ${paymentId} status to ${body.payment_status}`);
    }

    return json({ ok: true });
  } catch (error) {
    console.error('IPN processing error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
