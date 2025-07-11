<script lang="ts">
  // TODO: Replace with Svelte 5 compatible chart library
  // import { Pie, Line } from 'svelte-chartjs';

  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    CategoryScale,
    LineElement,
    LinearScale,
    PointElement,
  } from 'chart.js';
  import { randomColor, uniqueColors } from '$lib/cUtils';
  import type { PageData } from './$types';
  import InputWithIcon from '$lib/components/InputWithIcon.svelte';
  import { DollarSign } from '@steeze-ui/feather-icons';
  import { Monero, Telegram } from '@steeze-ui/simple-icons';
  import { enhance } from '$app/forms';
  import { toast } from '@zerodevx/svelte-toast';
  import toastThemes from '$lib/toastThemes';
  import { invalidateAll } from '$app/navigation';

  ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LineElement, LinearScale, PointElement);

  export let data: PageData;

  function maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 8) return cardNumber;
    const first4 = cardNumber.slice(0, 4);
    const last4 = cardNumber.slice(-4);
    const masked = '*'.repeat(cardNumber.length - 8);
    return `${first4}${masked}${last4}`;
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'LIVE': return 'text-green-400';
      case 'DEAD': return 'text-red-400';
      default: return 'text-neutral-400';
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  async function deleteCard(cardId: number) {
    if (!confirm('Are you sure you want to delete this card?')) {
      return;
    }

    try {
      const response = await fetch(`/seller/cvv/cards/${cardId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Refresh the page to update the data
        location.reload();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete card');
    }
  }
</script>

<div class="grid md:grid-cols-2 gap-4">
  <div class="card h-max">
    <h2 class="font-bold">Request a Payout</h2>
    <p class="text-neutral-300 mb-2 text-sm">Enter an XMR address below to request a payout</p>
    <form
      class="space-y-2"
      method="post"
      action="?/payout"
      use:enhance={({ formElement }) =>
        async ({ result }) => {
          if (result.type == 'success') {
            toast.push('Payout requested', {
              theme: toastThemes.success,
            });
          } else if (result.type == 'error') {
            toast.push(result.error.message, {
              theme: toastThemes.error,
            });
          } else if (result.type == 'failure') {
            const errorMessages = {
              address: 'Invalid address',
            };
            toast.push(
              errorMessages[result.data.error as keyof typeof errorMessages] || 'An error occurred',
              {
                theme: toastThemes.error,
              }
            );
          }

          await invalidateAll();
          formElement.reset();
        }}
    >
      <InputWithIcon icon={Monero} type="text" placeholder="Address" name="address" />
      <InputWithIcon
        icon={DollarSign}
        placeholder="Amount"
        type="number"
        name="amount"
        max={data.user.balance}
        step="1"
        min="10"
      />
      <button class="btn">Submit</button>
    </form>
  </div>
  <div class="card h-max">
    <h2 class="font-bold">Contact Details</h2>
    <p class="text-neutral-300 mb-2 text-sm">Enter your contact details to receive communication from customers</p>
    <form
      class="space-y-2"
      method="post"
      action="?/contact"
      use:enhance={({ formElement }) =>
        async ({ result }) => {
          if (result.type == 'success') {
            toast.push('Contact details updated', {
              theme: toastThemes.success,
            });
          } else if (result.type == 'error') {
            toast.push(result.error.message, {
              theme: toastThemes.error,
            });
          }

          formElement.reset();
        }}
    >
      <InputWithIcon icon={Telegram} placeholder="Telgram" name="telegram" />
      <button class="btn">Update</button>
    </form>
  </div>
</div>

<!-- CVV Management Section -->
<h2 class="my-5 text-xl font-bold">CVV Management</h2>

<div class="grid md:grid-cols-4 gap-4 mb-6">
  <div class="card text-center">
    <h3 class="text-lg font-semibold text-blue-400">Total Cards</h3>
    <p class="text-2xl font-bold">{data.cvvStats?.totalCards || 0}</p>
  </div>
  <div class="card text-center">
    <h3 class="text-lg font-semibold text-green-400">Live Cards</h3>
    <p class="text-2xl font-bold">{data.cvvStats?.liveCards || 0}</p>
  </div>
  <div class="card text-center">
    <h3 class="text-lg font-semibold text-yellow-400">Checked Cards</h3>
    <p class="text-2xl font-bold">{data.cvvStats?.checkedCards || 0}</p>
  </div>
  <div class="card text-center">
    <h3 class="text-lg font-semibold text-purple-400">Total Revenue</h3>
    <p class="text-2xl font-bold">${(data.cvvStats?.totalRevenue || 0).toFixed(2)}</p>
  </div>
</div>

<!-- CVV Management Actions -->
<div class="grid md:grid-cols-3 gap-4 mb-6">
  <a href="/seller/cvv" class="card text-center hover:bg-neutral-800 transition-colors">
    <div class="text-4xl mb-2">💳</div>
    <h3 class="text-lg font-semibold text-blue-400">Manage Cards</h3>
    <p class="text-sm text-neutral-400">View and manage your CVV cards</p>
  </a>
  
  <a href="/seller/cvv/upload" class="card text-center hover:bg-neutral-800 transition-colors">
    <div class="text-4xl mb-2">📤</div>
    <h3 class="text-lg font-semibold text-green-400">Upload Cards</h3>
    <p class="text-sm text-neutral-400">Upload new CVV cards to sell</p>
  </a>
  
  <a href="/seller/cvv/dashboard" class="card text-center hover:bg-neutral-800 transition-colors">
    <div class="text-4xl mb-2">📊</div>
    <h3 class="text-lg font-semibold text-purple-400">CVV Dashboard</h3>
    <p class="text-sm text-neutral-400">View CVV analytics and stats</p>
  </a>
</div>

<div class="grid md:grid-cols-2 gap-4 mb-6">
  <div class="card">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold">Recent Cards</h3>
      <a href="/seller/cvv/upload" class="btn btn-sm btn-primary">📤 Upload Cards</a>
    </div>
    
    {#if data.recentCards && data.recentCards.length > 0}
      <div class="space-y-2">
        {#each data.recentCards as card}
          <div class="flex justify-between items-center p-3 bg-neutral-800 rounded">
            <div>
              <div class="font-mono text-sm">{maskCardNumber(card.cardNumber)}</div>
              <div class="text-xs text-neutral-400">{card.country || 'Unknown'}</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-semibold {getStatusColor(card.status)}">{card.status}</div>
              <div class="text-xs text-neutral-400">${card.price}</div>
            </div>
            <button 
              on:click={() => deleteCard(card.id)}
              class="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-neutral-700"
            >
              Delete
            </button>
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-neutral-400 text-center py-4">No cards uploaded yet</p>
    {/if}
  </div>

  <div class="card">
    <h3 class="text-lg font-semibold mb-4">Recent Checks</h3>
    
    {#if data.recentChecks && data.recentChecks.length > 0}
      <div class="space-y-2">
        {#each data.recentChecks as check}
          <div class="flex justify-between items-center p-3 bg-neutral-800 rounded">
            <div>
              <div class="font-mono text-sm">{maskCardNumber(check.card.cardNumber)}</div>
              <div class="text-xs text-neutral-400">by {check.checker.username}</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-semibold {getStatusColor(check.result)}">{check.result}</div>
              <div class="text-xs text-neutral-400">${check.cost}</div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-neutral-400 text-center py-4">No checks performed yet</p>
    {/if}
  </div>
</div>

<h2 class="my-5 text-xl font-bold">Analytics</h2>

<div class="grid md:grid-cols-2 gap-4">
  <div class="card h-max">
    <h2 class="font-bold">Top Products</h2>
    <p class="text-neutral-300 mb-2 text-sm">Your best selling products in the past 7 days</p>
    <div class="w-72 h-72 mx-auto">
      <!-- TODO: Replace with Svelte 5 compatible chart component -->
      <div class="flex items-center justify-center h-full border-2 border-dashed border-neutral-600 rounded">
        <p class="text-neutral-400">Pie Chart will be displayed here</p>
      </div>
    </div>
  </div>
  <div class="card h-max">
    <h2 class="font-bold">Sales</h2>
    <p class="text-neutral-300 mb-2 text-sm">Sales by day in the past 7 days</p>
    <!-- TODO: Replace with Svelte 5 compatible chart component -->
    <div class="flex items-center justify-center h-32 border-2 border-dashed border-neutral-600 rounded">
      <p class="text-neutral-400">Line Chart will be displayed here</p>
    </div>
  </div>
</div>
