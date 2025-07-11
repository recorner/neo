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
      goto('/seller/cvv');
    }
  });

  async function deleteCard(cardId: number) {
    if (!confirm('Are you sure you want to delete this card?')) {
      return;
    }

    try {
      const response = await fetch(`/seller/cvv/cards/${cardId}`, {
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

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
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

  function maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 8) return cardNumber;
    const first4 = cardNumber.slice(0, 4);
    const last4 = cardNumber.slice(-4);
    const masked = '*'.repeat(cardNumber.length - 8);
    return `${first4}${masked}${last4}`;
  }

  async function updateCardPrice(cardId: number, newPrice: number) {
    try {
      const response = await fetch(`/seller/cvv/cards/${cardId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ price: newPrice })
      });

      if (response.ok) {
        // Update local price
        const cardIndex = recentCards.findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
          recentCards[cardIndex].price = newPrice;
        }
        alert('Price updated successfully');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update price');
    }
  }
</script>

<svelte:head>
  <title>CVV Dashboard - Seller Management</title>
</svelte:head>

<div class="max-w-7xl mx-auto space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold">CVV Dashboard</h1>
      <p class="text-neutral-400 mt-1">
        Manage your credit card inventory and track sales
      </p>
    </div>
    
    <div class="flex gap-2">
      <a href="/seller/cvv" class="btn btn-secondary">
        📋 Manage Cards
      </a>
      <a href="/seller/cvv/upload" class="btn btn-primary">
        📤 Upload Cards
      </a>
    </div>
  </div>

  <!-- Stats Overview -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="stat-card">
      <div class="stat-icon bg-blue-500">
        📊
      </div>
      <div>
        <h3 class="text-2xl font-bold">{stats.totalCards}</h3>
        <p class="text-neutral-400">Total Cards</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon bg-green-500">
        ✅
      </div>
      <div>
        <h3 class="text-2xl font-bold">{stats.liveCards}</h3>
        <p class="text-neutral-400">Live Cards</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon bg-red-500">
        ❌
      </div>
      <div>
        <h3 class="text-2xl font-bold">{stats.deadCards}</h3>
        <p class="text-neutral-400">Dead Cards</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon bg-yellow-500">
        💰
      </div>
      <div>
        <h3 class="text-2xl font-bold">${stats.totalEarnings?.toFixed(2) || '0.00'}</h3>
        <p class="text-neutral-400">Total Earnings</p>
      </div>
    </div>
  </div>

  <!-- Recent Cards -->
  <div class="card">
    <div class="card-header">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Recent Cards</h2>
        <a href="/seller/cvv" class="btn btn-sm btn-secondary">
          View All
        </a>
      </div>
    </div>
    <div class="card-body p-0">
      {#if recentCards.length === 0}
        <div class="flex items-center justify-center py-8">
          <div class="text-center">
            <p class="text-neutral-400 mb-4">No cards uploaded yet</p>
            <a href="/seller/cvv/upload" class="btn btn-primary">
              Upload Your First Cards
            </a>
          </div>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead>
              <tr>
                <th>Card</th>
                <th>Expiry</th>
                <th>Country</th>
                <th>Price</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each recentCards as card}
                <tr>
                  <td>
                    <div class="flex flex-col">
                      <span class="font-mono text-sm">{maskCardNumber(card.cardNumber)}</span>
                      <span class="text-xs text-neutral-400">{getCardType(card.cardNumber)}</span>
                    </div>
                  </td>
                  <td class="font-mono text-sm">{card.expMonth}/{card.expYear}</td>
                  <td>{card.country || 'Unknown'}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold">${card.price.toFixed(2)}</span>
                      <button
                        on:click={() => {
                          const newPrice = prompt('Enter new price:', card.price.toString());
                          if (newPrice && !isNaN(parseFloat(newPrice))) {
                            updateCardPrice(card.id, parseFloat(newPrice));
                          }
                        }}
                        class="btn btn-xs btn-secondary"
                        title="Edit Price"
                      >
                        ✏️
                      </button>
                    </div>
                  </td>
                  <td>
                    <span class="status-badge status-{card.status.toLowerCase()}">
                      {card.status}
                    </span>
                  </td>
                  <td class="text-xs text-neutral-400">
                    {formatDate(card.createdAt)}
                  </td>
                  <td>
                    <div class="flex gap-1">
                      <button
                        on:click={() => deleteCard(card.id)}
                        class="btn btn-xs btn-danger"
                        title="Delete Card"
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

  <!-- Recent Card Checks -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-semibold">Recent Card Checks</h2>
    </div>
    <div class="card-body p-0">
      {#if recentChecks.length === 0}
        <div class="flex items-center justify-center py-8">
          <p class="text-neutral-400">No card checks yet</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead>
              <tr>
                <th>Card</th>
                <th>Checker</th>
                <th>Result</th>
                <th>Cost</th>
                <th>Checked At</th>
              </tr>
            </thead>
            <tbody>
              {#each recentChecks as check}
                <tr>
                  <td class="font-mono text-sm">
                    {maskCardNumber(check.card.cardNumber)}
                  </td>
                  <td>{check.checker.username}</td>
                  <td>
                    <span class="status-badge status-{check.result.toLowerCase()}">
                      {check.result}
                    </span>
                  </td>
                  <td class="font-semibold">${check.cost.toFixed(2)}</td>
                  <td class="text-xs text-neutral-400">
                    {formatDateTime(check.createdAt)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-semibold">Quick Actions</h2>
    </div>
    <div class="card-body">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/seller/cvv/upload" class="action-card">
          <div class="text-2xl mb-2">📤</div>
          <h3 class="font-semibold">Upload Cards</h3>
          <p class="text-sm text-neutral-400">Add new cards to your inventory</p>
        </a>

        <a href="/seller/cvv" class="action-card">
          <div class="text-2xl mb-2">📋</div>
          <h3 class="font-semibold">Manage Inventory</h3>
          <p class="text-sm text-neutral-400">View and edit your cards</p>
        </a>

        <a href="/seller/dashboard" class="action-card">
          <div class="text-2xl mb-2">📊</div>
          <h3 class="font-semibold">Main Dashboard</h3>
          <p class="text-sm text-neutral-400">View overall seller stats</p>
        </a>
      </div>
    </div>
  </div>
</div>

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
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .stat-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  .action-card {
    background-color: rgb(38 38 38);
    border-radius: 0.5rem;
    border: 1px solid rgb(64 64 64);
    padding: 1.5rem;
    text-align: center;
    transition: all 0.2s;
    display: block;
    text-decoration: none;
    color: inherit;
  }

  .action-card:hover {
    background-color: rgb(50 50 50);
    transform: translateY(-2px);
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
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

  .btn-xs {
    padding: 0.125rem 0.25rem;
    font-size: 0.75rem;
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
