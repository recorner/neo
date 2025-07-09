<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  
  export let data: PageData;

  let stats = data.stats;
  let recentCards = data.recentCards || [];
  let recentChecks = data.recentChecks || [];
  
  // User permissions
  $: isAdmin = data.user?.role?.includes('ADMIN');
  $: isSeller = data.user?.role?.includes('SELLER');

  onMount(() => {
    if (!isSeller && !isAdmin) {
      goto('/cvv');
    }
  });

  async function deleteCard(cardId: number) {
    if (!confirm('Are you sure you want to delete this card?')) {
      return;
    }

    try {
      const response = await fetch(`/cvv/seller/cards/${cardId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove card from local list
        recentCards = recentCards.filter(card => card.id !== cardId);
        
        // Update stats
        stats.totalCards--;
        
        alert('Card deleted successfully');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete card');
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

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
</script>

<svelte:head>
  <title>Seller Dashboard - CVV System</title>
</svelte:head>

{#if !isSeller && !isAdmin}
  <div class="flex items-center justify-center min-h-96">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-red-500 mb-2">Access Denied</h2>
      <p class="text-neutral-400">You need seller permissions to access this dashboard.</p>
    </div>
  </div>
{:else}
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">Seller Dashboard</h1>
        <p class="text-neutral-400 mt-1">Manage your credit card inventory</p>
      </div>
      
      <div class="flex gap-2">
        <a href="/cvv/upload" class="btn btn-primary">
          📤 Upload Cards
        </a>
        <a href="/cvv" class="btn btn-secondary">
          ← Back to CVV Database
        </a>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="stat-card">
        <div class="stat-title">Total Cards</div>
        <div class="stat-value">{stats.totalCards}</div>
        <div class="stat-desc">Cards uploaded</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-title">Checked Cards</div>
        <div class="stat-value">{stats.checkedCards}</div>
        <div class="stat-desc">Cards that have been verified</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-title">Live Cards</div>
        <div class="stat-value text-green-400">{stats.liveCards}</div>
        <div class="stat-desc">Active working cards</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-title">Revenue</div>
        <div class="stat-value">${stats.totalRevenue.toFixed(2)}</div>
        <div class="stat-desc">From card checks</div>
      </div>
    </div>

    <!-- Recent Cards -->
    <div class="card">
      <div class="card-header flex justify-between items-center">
        <h2 class="text-xl font-semibold">Recent Cards</h2>
        <a href="/cvv?seller=true" class="btn btn-sm btn-secondary">View All</a>
      </div>
      <div class="card-body p-0">
        {#if recentCards.length === 0}
          <div class="flex items-center justify-center py-8">
            <div class="text-center">
              <div class="text-neutral-400 mb-2">No cards uploaded yet</div>
              <a href="/cvv/upload" class="btn btn-primary btn-sm">Upload Cards</a>
            </div>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="table w-full">
              <thead>
                <tr>
                  <th>Card Number</th>
                  <th>Type</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each recentCards as card}
                  <tr class="hover:bg-neutral-800/50">
                    <td>
                      <div class="font-mono text-sm">
                        {isAdmin ? card.cardNumber : maskCardNumber(card.cardNumber)}
                      </div>
                    </td>
                    <td>
                      <div class="text-sm">
                        {card.cardNumber.startsWith('4') ? 'Visa' : 
                         card.cardNumber.startsWith('5') ? 'Mastercard' : 
                         card.cardNumber.startsWith('3') ? 'Amex' : 'Other'}
                      </div>
                    </td>
                    <td>
                      <div class="text-sm">{card.country || 'Unknown'}</div>
                    </td>
                    <td>
                      <span class="status-badge status-{card.status.toLowerCase()}">
                        {card.status}
                      </span>
                    </td>
                    <td>
                      <div class="text-sm font-medium">
                        ${card.price.toFixed(2)}
                        {#if card.isDiscounted}
                          <span class="text-green-400 text-xs">🏷️</span>
                        {/if}
                      </div>
                    </td>
                    <td>
                      <div class="text-sm text-neutral-400">
                        {formatDate(card.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div class="flex gap-1">
                        <button
                          on:click={() => goto(`/cvv/seller/cards/${card.id}/edit`)}
                          class="btn btn-sm btn-secondary"
                        >
                          ✏️
                        </button>
                        <button
                          on:click={() => deleteCard(card.id)}
                          class="btn btn-sm btn-danger"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>

    <!-- Recent Checks -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-xl font-semibold">Recent Card Checks</h2>
      </div>
      <div class="card-body p-0">
        {#if recentChecks.length === 0}
          <div class="flex items-center justify-center py-8">
            <div class="text-neutral-400">No checks performed yet</div>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="table w-full">
              <thead>
                <tr>
                  <th>Card</th>
                  <th>Checker</th>
                  <th>Result</th>
                  <th>Revenue</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {#each recentChecks as check}
                  <tr class="hover:bg-neutral-800/50">
                    <td>
                      <div class="font-mono text-sm">
                        {maskCardNumber(check.card.cardNumber)}
                      </div>
                    </td>
                    <td>
                      <div class="text-sm">{check.checker.username}</div>
                    </td>
                    <td>
                      <span class="status-badge status-{check.result.toLowerCase()}">
                        {check.result}
                      </span>
                    </td>
                    <td>
                      <div class="text-sm font-medium text-green-400">
                        +${check.cost.toFixed(2)}
                      </div>
                    </td>
                    <td>
                      <div class="text-sm text-neutral-400">
                        {formatDate(check.createdAt)}
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .card {
    background-color: rgb(23 23 23);
    border-radius: 0.5rem;
    border: 1px solid rgb(64 64 64);
  }
  
  .card-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgb(64 64 64);
  }
  
  .card-body {
    padding: 1rem 1.5rem;
  }

  .stat-card {
    background-color: rgb(23 23 23);
    border-radius: 0.5rem;
    border: 1px solid rgb(64 64 64);
    padding: 1.5rem;
  }

  .stat-title {
    font-size: 0.875rem;
    color: rgb(163 163 163);
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: white;
    margin-bottom: 0.25rem;
  }

  .stat-desc {
    font-size: 0.75rem;
    color: rgb(115 115 115);
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
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

  .btn-danger {
    background-color: rgb(220 38 38);
    color: white;
  }
  
  .btn-danger:hover:not(:disabled) {
    background-color: rgb(185 28 28);
  }
  
  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .table th {
    background-color: rgb(38 38 38);
    text-align: left;
    padding: 0.75rem;
    font-weight: 500;
    font-size: 0.875rem;
  }
  
  .table td {
    padding: 0.75rem;
    border-bottom: 1px solid rgb(64 64 64);
  }

  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
  }
  
  .status-unchecked {
    background-color: rgb(64 64 64);
    color: white;
  }
  
  .status-live {
    background-color: rgb(34 197 94);
    color: white;
  }
  
  .status-dead {
    background-color: rgb(239 68 68);
    color: white;
  }
</style>
