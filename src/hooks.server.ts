import { paymentMonitor } from '$lib/payment-monitor';
import type { Handle } from '@sveltejs/kit';

// Start payment monitoring service
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  console.log('🚀 Starting payment monitor service...');
  paymentMonitor.start();
}

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  return response;
};
