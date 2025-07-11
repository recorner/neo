<script lang="ts">
  import { goto } from '$app/navigation';
  import { enhance } from '$app/forms';
  import { CreditCard, Shield, MapPin, DollarSign, User, Calendar, Eye, EyeOff } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import type { PageData } from './$types';
  import { toast } from '@zerodevx/svelte-toast';
  import toastThemes from '$lib/toastThemes';
  
  export let data: PageData;

  let showFullCard = false;
  let checkingCard = false;

  function maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 8) return cardNumber;
    const first4 = cardNumber.slice(0, 4);
    const last4 = cardNumber.slice(-4);
    const masked = '*'.repeat(cardNumber.length - 8);
    return `${first4}${masked}${last4}`;
  }

  function getCardType(cardNumber: string): string {
    if (!cardNumber) return '';
    const bin = cardNumber.slice(0, 1);
    switch (bin) {
      case '4': return 'Visa';
      case '5': return 'Mastercard';
      case '3': return 'Amex';
      case '6': return 'Discover';
      default: return 'Unknown';
    }
  }

  function getCardTypeIcon(cardNumber: string): string {
    const type = getCardType(cardNumber);
    switch (type) {
      case 'Visa': return '💳';
      case 'Mastercard': return '🏦';
      case 'Amex': return '💎';
      case 'Discover': return '🔍';
      default: return '💳';
    }
  }

  function getBinInfo(cardNumber: string): string {
    if (!cardNumber) return '';
    return cardNumber.slice(0, 6);
  }

  async function purchaseCard() {
    checkingCard = true;
    
    try {
      const response = await fetch('/api/cvv/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cardId: data.card.id
        })
      });

      const result = await response.json();

      if (response.ok) {
        showFullCard = true;
        toast.push(`Card purchased successfully! Remaining balance: $${result.remainingBalance}`, {
          theme: toastThemes.success
        });
      } else {
        toast.push(`Error: ${result.error}`, {
          theme: toastThemes.error
        });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.push('Failed to purchase card. Please try again.', {
        theme: toastThemes.error
      });
    } finally {
      checkingCard = false;
    }
  }
</script>

<svelte:head>
  <title>{getCardType(data.card.cardNumber)} Card - {maskCardNumber(data.card.cardNumber)}</title>
</svelte:head>

<div class="flex gap-4 flex-col-reverse md:flex-row">
  <!-- Card Details -->
  <div class="card w-full h-max">
    <div class="flex items-center gap-3 mb-4">
      <span class="text-4xl">{getCardTypeIcon(data.card.cardNumber)}</span>
      <div>
        <h2 class="font-semibold text-2xl">{getCardType(data.card.cardNumber)} Credit Card</h2>
        <p class="text-neutral-300">
          Sold by
          <a href="/seller/{data.card.seller.id}" class="hover:underline text-white">{data.card.seller.username}</a>
        </p>
      </div>
    </div>

    <!-- Card Preview -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-6 max-w-md">
      <div class="flex justify-between items-start mb-4">
        <div class="text-sm opacity-80">Credit Card</div>
        <div class="text-xl">{getCardTypeIcon(data.card.cardNumber)}</div>
      </div>
      
      <div class="font-mono text-lg tracking-wider mb-4">
        {showFullCard ? data.card.cardNumber : maskCardNumber(data.card.cardNumber)}
      </div>
      
      <div class="flex justify-between items-end">
        <div>
          <div class="text-xs opacity-80 mb-1">CARDHOLDER</div>
          <div class="text-sm font-medium">
            {showFullCard ? (data.card.fullName || 'NO NAME') : '●●●●● ●●●●●'}
          </div>
        </div>
        <div>
          <div class="text-xs opacity-80 mb-1">EXPIRES</div>
          <div class="text-sm font-medium">
            {data.card.expMonth.toString().padStart(2, '0')}/{data.card.expYear}
          </div>
        </div>
        <div>
          <div class="text-xs opacity-80 mb-1">CVV</div>
          <div class="text-sm font-medium">
            {showFullCard ? data.card.cvv : '●●●'}
          </div>
        </div>
      </div>
    </div>

    <!-- Card Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="flex items-center gap-2">
        <Icon src={CreditCard} class="w-5 h-5 text-blue-400" />
        <div>
          <div class="text-sm text-neutral-400">BIN Range</div>
          <div class="font-mono">{getBinInfo(data.card.cardNumber)}******</div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Icon src={MapPin} class="w-5 h-5 text-green-400" />
        <div>
          <div class="text-sm text-neutral-400">Country</div>
          <div>{data.card.country || 'Unknown'}</div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Icon src={Calendar} class="w-5 h-5 text-purple-400" />
        <div>
          <div class="text-sm text-neutral-400">Expiry Date</div>
          <div class="font-mono">{data.card.expMonth.toString().padStart(2, '0')}/{data.card.expYear}</div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Icon src={Shield} class="w-5 h-5 text-green-400" />
        <div>
          <div class="text-sm text-neutral-400">Status</div>
          <span class="status-badge status-live">VERIFIED</span>
        </div>
      </div>
    </div>

    {#if data.card.state || data.card.zip}
      <div class="border-t border-neutral-700 pt-4">
        <h3 class="font-semibold mb-2">Billing Address</h3>
        <div class="text-sm text-neutral-300">
          {#if showFullCard}
            {data.card.state || 'N/A'} {data.card.zip || ''}
          {:else}
            Purchase card to view billing details
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Purchase Panel -->
  <div class="card md:w-80 lg:w-[30rem] h-max sticky top-4">
    <div class="text-center mb-4">
      <div class="text-3xl font-bold text-green-400 mb-1">
        ${data.card.price.toFixed(2)}
      </div>
      {#if data.card.isDiscounted}
        <div class="text-sm text-orange-400">🏷️ Special Discount</div>
      {/if}
    </div>

    {#if !showFullCard}
      <button
        on:click={purchaseCard}
        disabled={checkingCard}
        class="btn btn-primary w-full mb-4"
      >
        {#if checkingCard}
          <span class="loading loading-spinner loading-sm"></span>
          Processing...
        {:else}
          <Icon src={DollarSign} class="w-4 h-4 mr-2" />
          Purchase Card
        {/if}
      </button>

      <div class="text-xs text-neutral-400 text-center mb-4">
        You will be charged ${data.card.price.toFixed(2)} from your account balance
      </div>

      <div class="border-t border-neutral-700 pt-4">
        <h3 class="font-semibold mb-2 flex items-center gap-2">
          <Icon src={Eye} class="w-4 h-4" />
          What you'll get:
        </h3>
        <ul class="text-sm text-neutral-300 space-y-1">
          <li>• Full card number</li>
          <li>• CVV security code</li>
          <li>• Cardholder name</li>
          <li>• Billing address</li>
          <li>• Verified working status</li>
        </ul>
      </div>
    {:else}
      <div class="text-center text-green-400 mb-4">
        <Icon src={Shield} class="w-8 h-8 mx-auto mb-2" />
        <div class="font-semibold">Card Purchased!</div>
        <div class="text-sm text-neutral-400">Full details now visible</div>
      </div>

      <button
        on:click={() => showFullCard = false}
        class="btn btn-secondary w-full mb-4"
      >
        <Icon src={EyeOff} class="w-4 h-4 mr-2" />
        Hide Details
      </button>
    {/if}

    <div class="text-xs text-neutral-500 text-center">
      This card has been verified as working and live
    </div>
  </div>
</div>

<style>
  .card {
    background-color: rgb(23 23 23);
    border-radius: 0.5rem;
    border: 1px solid rgb(64 64 64);
    padding: 1.5rem;
  }

  .btn {
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-primary {
    background-color: rgb(37 99 235);
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background-color: rgb(29 78 216);
  }
  
  .btn-secondary {
    background-color: rgb(64 64 64);
    color: white;
  }
  
  .btn-secondary:hover:not(:disabled) {
    background-color: rgb(82 82 82);
  }

  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
  }
  
  .status-live {
    background-color: rgb(34 197 94);
    color: white;
  }
</style>
