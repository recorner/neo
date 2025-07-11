<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  
  export let data: PageData;

  let cards = data.cards || [];
  let totalCount = data.totalCount || 0;
  let currentPage = data.currentPage || 1;
  let totalPages = Math.ceil(totalCount / 50);
  
  // Filter states
  let filters = {
    search: '',
    country: '',
    binRange: '',
    priceMin: '',
    priceMax: '',
    status: '',
    isDiscounted: false,
    expMonthMin: '',
    expMonthMax: '',
    expYearMin: '',
    expYearMax: ''
  };

  let isLoading = false;
  let showFilters = false;
  let selectedCard: any = null;
  let showCardModal = false;
  let checkingCard = false;

  // User permissions
  $: isAdmin = data.user?.role?.includes('ADMIN');
  $: isSeller = data.user?.role?.includes('SELLER');
  $: isBuyer = !isSeller && !isAdmin;

  onMount(() => {
    // Load filters from URL params
    const urlParams = new URLSearchParams($page.url.search);
    Object.keys(filters).forEach(key => {
      const value = urlParams.get(key);
      if (value) {
        if (key === 'isDiscounted') {
          filters[key] = value === 'true';
        } else {
          filters[key] = value;
        }
      }
    });
  });

  async function loadCards(pageNum = 1) {
    isLoading = true;
    
    const params = new URLSearchParams();
    params.set('page', pageNum.toString());
    
    // Add active filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== false) {
        params.set(key, value.toString());
      }
    });

    try {
      const response = await fetch(`/seller/cvv?${params.toString()}`);
      const result = await response.json();
      
      if (response.ok) {
        cards = result.cards;
        totalCount = result.totalCount;
        currentPage = result.currentPage;
        totalPages = Math.ceil(totalCount / 50);
        
        // Update URL
        goto(`?${params.toString()}`, { replaceState: true, noScroll: true });
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      isLoading = false;
    }
  }

  function handleFilterChange() {
    loadCards(1);
  }

  function resetFilters() {
    filters = {
      search: '',
      country: '',
      binRange: '',
      priceMin: '',
      priceMax: '',
      status: '',
      isDiscounted: false,
      expMonthMin: '',
      expMonthMax: '',
      expYearMin: '',
      expYearMax: ''
    };
    loadCards(1);
  }

  function maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 8) return cardNumber;
    const first4 = cardNumber.slice(0, 4);
    const last4 = cardNumber.slice(-4);
    const masked = '*'.repeat(cardNumber.length - 8);
    return `${first4}${masked}${last4}`;
  }

  function canViewFullCard(card: any): boolean {
    return isAdmin || (isSeller && card.sellerId === data.user?.id);
  }

  function openCardModal(card: any) {
    selectedCard = card;
    showCardModal = true;
  }

  function getBinInfo(cardNumber: string): string {
    if (!cardNumber) return '';
    return cardNumber.slice(0, 6);
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

  async function deleteCard(cardId: number) {
    if (!confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/seller/cvv/cards/${cardId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        cards = cards.filter(card => card.id !== cardId);
        totalCount--;
        totalPages = Math.ceil(totalCount / 50);
        alert('Card deleted successfully');
      } else {
        const result = await response.json();
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete card. Please try again.');
    }
  }
</script>

<svelte:head>
  <title>CVV Management - Seller Dashboard</title>
</svelte:head>

<div class="max-w-7xl mx-auto space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold">CVV Management</h1>
      <p class="text-neutral-400 mt-1">
        {totalCount} cards available • Your earnings from card sales
      </p>
    </div>
    
    <div class="flex gap-2">
      <a href="/seller/cvv/upload" class="btn btn-primary">
        📤 Upload Cards
      </a>
      <a href="/seller/cvv/dashboard" class="btn btn-secondary">
        📊 CVV Dashboard
      </a>
      <button
        on:click={() => showFilters = !showFilters}
        class="btn btn-secondary"
      >
        🔍 Filters
      </button>
    </div>
  </div>

  <!-- Filters Panel -->
  {#if showFilters}
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-semibold">Filters</h2>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label for="search" class="block text-sm font-medium mb-1">Search (BIN/Country)</label>
            <input
              bind:value={filters.search}
              on:input={handleFilterChange}
              placeholder="Search..."
              class="input w-full"
            />
          </div>
          
          <div>
            <label for="country" class="block text-sm font-medium mb-1">Country</label>
            <input
              bind:value={filters.country}
              on:input={handleFilterChange}
              placeholder="Country"
              class="input w-full"
            />
          </div>

          <div>
            <label for="status" class="block text-sm font-medium mb-1">Status</label>
            <select
              bind:value={filters.status}
              on:change={handleFilterChange}
              class="input w-full"
            >
              <option value="">All Status</option>
              <option value="UNCHECKED">Unchecked</option>
              <option value="LIVE">Live</option>
              <option value="DEAD">Dead</option>
            </select>
          </div>

          <div class="flex items-end">
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                bind:checked={filters.isDiscounted}
                on:change={handleFilterChange}
                class="checkbox"
              />
              <span class="text-sm">Discounted Only</span>
            </label>
          </div>

          <div>
            <label for="priceMin" class="block text-sm font-medium mb-1">Min Price</label>
            <input
              bind:value={filters.priceMin}
              on:input={handleFilterChange}
              type="number"
              step="0.01"
              placeholder="0.00"
              class="input w-full"
            />
          </div>

          <div>
            <label for="priceMax" class="block text-sm font-medium mb-1">Max Price</label>
            <input
              bind:value={filters.priceMax}
              on:input={handleFilterChange}
              type="number"
              step="0.01"
              placeholder="999.99"
              class="input w-full"
            />
          </div>

          <div>
            <label for="expYearMin" class="block text-sm font-medium mb-1">Min Exp Year</label>
            <input
              bind:value={filters.expYearMin}
              on:input={handleFilterChange}
              placeholder="2025"
              class="input w-full"
            />
          </div>

          <div class="flex items-end">
            <button
              on:click={resetFilters}
              class="btn btn-secondary w-full"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Cards Table -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-semibold">
        Your Cards {currentPage > 1 ? `(Page ${currentPage} of ${totalPages})` : ''}
      </h2>
    </div>
    <div class="card-body p-0">
      {#if isLoading}
        <div class="flex items-center justify-center py-8">
          <div class="text-neutral-400">Loading cards...</div>
        </div>
      {:else if cards.length === 0}
        <div class="flex items-center justify-center py-8">
          <div class="text-center">
            <p class="text-neutral-400 mb-4">No cards found</p>
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
                <th>Card Number</th>
                <th>Expiry</th>
                <th>CVV</th>
                <th>Country</th>
                <th>Price</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each cards as card}
                <tr>
                  <td>
                    <div class="flex flex-col">
                      <span class="font-mono">{canViewFullCard(card) ? card.cardNumber : maskCardNumber(card.cardNumber)}</span>
                      <span class="text-xs text-neutral-400">{getCardType(card.cardNumber)} • BIN: {getBinInfo(card.cardNumber)}</span>
                    </div>
                  </td>
                  <td class="font-mono">{card.expMonth}/{card.expYear}</td>
                  <td class="font-mono">{canViewFullCard(card) ? card.cvv : '***'}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <span>{card.country || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>
                    <div class="flex flex-col">
                      <span class="font-semibold">${card.price.toFixed(2)}</span>
                      {#if card.isDiscounted}
                        <span class="text-xs text-green-400">Discounted</span>
                      {/if}
                    </div>
                  </td>
                  <td>
                    <span class="status-badge status-{card.status.toLowerCase()}">
                      {card.status}
                    </span>
                  </td>
                  <td>
                    <div class="text-xs text-neutral-400">
                      {new Date(card.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <button
                        on:click={() => openCardModal(card)}
                        class="btn btn-sm btn-secondary"
                      >
                        View
                      </button>
                      <button
                        on:click={() => deleteCard(card.id)}
                        class="btn btn-sm btn-danger"
                      >
                        Delete
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

  <!-- Pagination -->
  {#if totalPages > 1}
    <div class="flex justify-center gap-2">
      <button
        on:click={() => loadCards(currentPage - 1)}
        disabled={currentPage <= 1}
        class="btn btn-secondary"
      >
        ← Previous
      </button>
      
      <span class="flex items-center px-4 text-sm">
        Page {currentPage} of {totalPages}
      </span>
      
      <button
        on:click={() => loadCards(currentPage + 1)}
        disabled={currentPage >= totalPages}
        class="btn btn-secondary"
      >
        Next →
      </button>
    </div>
  {/if}
</div>

<!-- Card Details Modal -->
{#if showCardModal && selectedCard}
  <div class="modal-overlay" on:click={() => showCardModal = false} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && (showCardModal = false)}>
    <div class="modal" on:click|stopPropagation role="dialog" tabindex="-1">
      <div class="modal-header">
        <h3 class="text-lg font-semibold">Card Details</h3>
        <button on:click={() => showCardModal = false} class="btn btn-sm">✕</button>
      </div>
      <div class="modal-body">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div class="label">Card Number</div>
            <div class="value font-mono">{selectedCard.cardNumber}</div>
          </div>
          
          <div>
            <div class="label">Expiry Date</div>
            <div class="value font-mono">{selectedCard.expMonth}/{selectedCard.expYear}</div>
          </div>
          
          <div>
            <div class="label">CVV</div>
            <div class="value font-mono">{selectedCard.cvv}</div>
          </div>
          
          <div>
            <div class="label">Cardholder Name</div>
            <div class="value">{selectedCard.fullName || 'N/A'}</div>
          </div>
          
          <div>
            <div class="label">Country</div>
            <div class="value">{selectedCard.country || 'N/A'}</div>
          </div>
          
          <div>
            <div class="label">State/Zip</div>
            <div class="value">{selectedCard.state || 'N/A'} {selectedCard.zip || ''}</div>
          </div>
          
          <div>
            <div class="label">Price</div>
            <div class="value">${selectedCard.price.toFixed(2)}</div>
          </div>
          
          <div>
            <div class="label">Status</div>
            <div class="value">
              <span class="status-badge status-{selectedCard.status.toLowerCase()}">
                {selectedCard.status}
              </span>
            </div>
          </div>
        </div>
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

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
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

  .input, .select {
    background-color: rgb(38 38 38);
    border: 1px solid rgb(64 64 64);
    border-radius: 0.375rem;
    padding: 0.5rem 0.75rem;
    color: white;
    width: 100%;
  }
  
  .input:focus, .select:focus {
    border-color: rgb(59 130 246);
    outline: none;
  }

  .checkbox {
    accent-color: rgb(37 99 235);
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

  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
  }

  .modal {
    background-color: rgb(23 23 23);
    border-radius: 0.5rem;
    border: 1px solid rgb(64 64 64);
    max-width: 42rem;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgb(64 64 64);
  }

  .modal-body {
    padding: 1.5rem;
  }

  .label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: rgb(163 163 163);
    margin-bottom: 0.25rem;
  }

  .value {
    color: white;
    margin-bottom: 0.75rem;
  }
</style>
