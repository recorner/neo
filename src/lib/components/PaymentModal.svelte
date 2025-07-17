<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import { toast } from '@zerodevx/svelte-toast';
  import toastThemes from '$lib/toastThemes';
  import QRCode from 'qrcode';
  
  const dispatch = createEventDispatcher();

  export let show = false;
  export let initialAmount = 50;

  let paymentForm = {
    amount: 50,
    currency: 'btc',
    telegramUsername: ''
  };

  let availableCurrencies: string[] = [];
  let currentPayment: any = null;
  let paymentStatus = 'idle'; // idle, creating, pending, confirmed, failed
  let qrCodeDataUrl = '';
  let statusCheckInterval: ReturnType<typeof setInterval>;
  let statusCheckCount = 0;
  const MAX_STATUS_CHECKS = 120; // 10 minutes (5s intervals)

  $: if (show) {
    loadCurrencies();
  }

  // Update amount when initialAmount changes
  $: if (initialAmount) {
    paymentForm.amount = initialAmount;
  }

  $: if (availableCurrencies.length > 0 && !paymentForm.currency) {
    paymentForm.currency = availableCurrencies[0];
  }

  onDestroy(() => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
  });

  async function loadCurrencies() {
    try {
      const response = await fetch('/api/payment');
      if (response.ok) {
        const data = await response.json();
        availableCurrencies = data.currencies || [];
        console.log('Loaded currencies:', availableCurrencies);
        // Set default currency if none selected
        if (availableCurrencies.length > 0 && !paymentForm.currency) {
          paymentForm.currency = availableCurrencies[0];
          console.log('Set default currency to:', paymentForm.currency);
        }
      } else {
        console.error('Failed to fetch currencies, response not ok:', response.status);
      }
    } catch (error) {
      console.error('Failed to load currencies:', error);
      toast.push('Failed to load payment methods', { theme: toastThemes.error });
    }
  }

  async function createPayment() {
    if (paymentStatus === 'creating') return;
    
    paymentStatus = 'creating';
    
    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentForm.amount,
          currency: paymentForm.currency,
          telegramUsername: paymentForm.telegramUsername || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment creation failed');
      }

      currentPayment = result.payment;
      paymentStatus = 'pending';
      
      // Generate QR code
      if (currentPayment.pay_address) {
        qrCodeDataUrl = await QRCode.toDataURL(
          `${paymentForm.currency}:${currentPayment.pay_address}?amount=${currentPayment.pay_amount}`,
          { width: 180, margin: 1 }
        );
      }

      // Start status checking
      startStatusChecking();
      
      toast.push('Payment created successfully', { theme: toastThemes.success });
    } catch (error) {
      console.error('Payment creation error:', error);
      toast.push(error.message || 'Failed to create payment', { theme: toastThemes.error });
      paymentStatus = 'idle';
    }
  }

  function startStatusChecking() {
    statusCheckCount = 0;
    statusCheckInterval = setInterval(async () => {
      await checkPaymentStatus();
      statusCheckCount++;
      
      if (statusCheckCount >= MAX_STATUS_CHECKS) {
        clearInterval(statusCheckInterval);
        toast.push('Payment status check timeout', { theme: toastThemes.warning });
      }
    }, 5000);
  }

  async function checkPaymentStatus() {
    if (!currentPayment?.id) return;

    try {
      const response = await fetch(`/api/payment/status?id=${currentPayment.id}`);
      const result = await response.json();

      if (response.ok && result.payment) {
        const payment = result.payment;
        
        if (payment.status === 'confirmed' || payment.local_completed) {
          paymentStatus = 'confirmed';
          clearInterval(statusCheckInterval);
          
          toast.push('Payment confirmed! Your balance has been updated.', { 
            theme: toastThemes.success 
          });
          
          // Notify parent component to refresh data
          dispatch('paymentConfirmed');
          
          // Close modal after a short delay
          setTimeout(() => {
            closeModal();
          }, 2000);
          
        } else if (['failed', 'expired', 'refunded'].includes(payment.status)) {
          paymentStatus = 'failed';
          clearInterval(statusCheckInterval);
          
          toast.push(`Payment ${payment.status}`, { theme: toastThemes.error });
        }
        
        currentPayment = { ...currentPayment, ...payment };
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  }

  function closeModal() {
    show = false;
    resetPayment();
    dispatch('close');
  }

  function resetPayment() {
    currentPayment = null;
    paymentStatus = 'idle';
    qrCodeDataUrl = '';
    statusCheckCount = 0;
    
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
  }

  function copyToClipboard(text: string) {
    if (browser) {
      navigator.clipboard.writeText(text).then(() => {
        toast.push('Copied to clipboard', { theme: toastThemes.success });
      });
    }
  }

  function formatCurrency(currency: string): string {
    return currency.toUpperCase();
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed': return 'text-green-400';
      case 'pending': case 'waiting': return 'text-yellow-400';
      case 'failed': case 'expired': case 'refunded': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'confirmed': return '✅';
      case 'pending': case 'waiting': return '⏳';
      case 'failed': case 'expired': case 'refunded': return '❌';
      default: return '⏱️';
    }
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-center p-4 sm:p-6 border-b border-gray-700">
        <h2 class="text-lg sm:text-xl font-semibold text-white">Crypto Payment</h2>
        <button
          type="button"
          on:click={closeModal}
          class="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center"
        >
          ×
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 sm:p-6">
        {#if paymentStatus === 'idle'}
          <!-- Payment Form -->
          <div class="grid gap-4 sm:gap-6">
            <div class="grid gap-4">
              <div>
                <label for="amount" class="block text-sm font-medium text-gray-300 mb-2">Amount (USD)</label>
                <input
                  id="amount"
                  type="number"
                  min="10"
                  max="100000"
                  step="0.01"
                  bind:value={paymentForm.amount}
                  class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount"
                />
                <p class="text-xs text-gray-400 mt-1">Minimum: $10, Maximum: $100,000</p>
              </div>

              <div>
                <label for="currency" class="block text-sm font-medium text-gray-300 mb-2">Cryptocurrency</label>
                <select
                  id="currency"
                  bind:value={paymentForm.currency}
                  class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {#each availableCurrencies as currency}
                    <option value={currency}>{formatCurrency(currency)}</option>
                  {/each}
                </select>
                {#if availableCurrencies.length === 0}
                  <p class="text-xs text-gray-400 mt-1">Loading currencies...</p>
                {/if}
              </div>

              <div>
                <label for="telegram" class="block text-sm font-medium text-gray-300 mb-2">
                  Telegram Username (Optional)
                </label>
                <input
                  id="telegram"
                  type="text"
                  bind:value={paymentForm.telegramUsername}
                  class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="@yourusername"
                />
                <p class="text-xs text-gray-400 mt-1">
                  📱 Get notified on Telegram when your payment is confirmed
                </p>
              </div>

              <button
                type="button"
                on:click={createPayment}
                disabled={!paymentForm.amount || paymentForm.amount < 10 || availableCurrencies.length === 0}
                class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {availableCurrencies.length === 0 ? 'Loading...' : 'Create Payment'}
              </button>
            </div>
          </div>

        {:else if paymentStatus === 'creating'}
          <!-- Creating Payment -->
          <div class="text-center py-8">
            <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p class="text-lg text-gray-300">Creating payment...</p>
          </div>

        {:else if paymentStatus === 'pending' && currentPayment}
          <!-- Payment Details -->
          <div class="grid gap-4 sm:gap-6">
            <div class="text-center mb-4">
              <div class="text-4xl mb-2">⏳</div>
              <p class="text-lg font-medium text-yellow-400">Waiting for payment</p>
              <p class="text-sm text-gray-400">Status checks: {statusCheckCount}/{MAX_STATUS_CHECKS}</p>
            </div>

            <div class="grid gap-4 lg:grid-cols-2">
              <!-- Payment Info -->
              <div class="bg-gray-800 p-4 rounded-lg">
                <h3 class="font-semibold mb-3">Payment Details</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-400">Amount:</span>
                    <span class="font-medium">
                      {currentPayment.pay_amount} {formatCurrency(currentPayment.pay_currency)}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">USD Value:</span>
                    <span class="font-medium">${currentPayment.amount}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Status:</span>
                    <span class="font-medium text-yellow-400">PENDING</span>
                  </div>
                </div>
              </div>

              <!-- QR Code and Address -->
              {#if currentPayment.pay_address}
                <div class="bg-gray-800 p-4 rounded-lg">
                  <h3 class="font-semibold mb-3">Payment Address</h3>
                  
                  {#if qrCodeDataUrl}
                    <div class="text-center mb-4">
                      <img src={qrCodeDataUrl} alt="Payment QR Code" class="mx-auto w-32 h-32 sm:w-40 sm:h-40" />
                    </div>
                  {/if}
                  
                  <div class="bg-gray-900 p-3 rounded border break-all text-xs sm:text-sm font-mono">
                    {currentPayment.pay_address}
                  </div>
                  
                  <button
                    type="button"
                    on:click={() => copyToClipboard(currentPayment.pay_address)}
                    class="mt-2 w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded transition-colors text-sm"
                  >
                    📋 Copy Address
                  </button>
                </div>
              {/if}
            </div>

            <!-- Instructions -->
            <div class="bg-yellow-900/20 border border-yellow-600 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-400 mb-2">Instructions</h4>
              <ol class="text-sm text-yellow-200 space-y-1">
                <li>1. Send exactly <strong>{currentPayment.pay_amount} {formatCurrency(currentPayment.pay_currency)}</strong></li>
                <li>2. To the address above</li>
                <li>3. Wait for network confirmation</li>
                <li>4. Your balance will update automatically</li>
              </ol>
              <div class="mt-3 pt-3 border-t border-yellow-600">
                <p class="text-xs text-yellow-300">
                  💡 <strong>You can safely close this modal and check payment status later via:</strong><br>
                  • Balance → Payment History<br>
                  • We'll keep monitoring your payment in the background
                  {#if paymentForm.telegramUsername}
                    <br>• Telegram notifications to @{paymentForm.telegramUsername.replace(/^@/, '')}
                  {/if}
                </p>
              </div>
            </div>

            <!-- Safe to Close Button -->
            <div class="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                on:click={closeModal}
                class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                ✅ Safe to Close
              </button>
              <a
                href="/balance/history"
                class="text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                📋 View History
              </a>
            </div>
          </div>

        {:else if paymentStatus === 'confirmed'}
          <!-- Payment Confirmed -->
          <div class="text-center py-8">
            <div class="text-6xl mb-4">✅</div>
            <p class="text-xl font-medium text-green-400 mb-2">Payment Confirmed!</p>
            <p class="text-gray-300">Your balance has been updated.</p>
          </div>

        {:else if paymentStatus === 'failed'}
          <!-- Payment Failed -->
          <div class="text-center py-8">
            <div class="text-6xl mb-4">❌</div>
            <p class="text-xl font-medium text-red-400 mb-2">Payment Failed</p>
            <p class="text-gray-300 mb-4">Please try again or contact support.</p>
            <button
              type="button"
              on:click={resetPayment}
              class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
