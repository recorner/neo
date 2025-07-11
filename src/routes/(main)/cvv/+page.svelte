<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { ChevronLeft, ChevronRight, Frown, CreditCard, Shield, MapPin, DollarSign, Search, Filter, X } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import type { PageData } from './$types';
  
  export let data: PageData;

  // Filter state with safe defaults
  let searchQuery = (data as any).filters?.search || '';
  let selectedCardType = (data as any).filters?.cardType || '';
  let selectedCountry = (data as any).filters?.country || '';
  let minPrice = (data as any).filters?.minPrice || 0;
  let maxPrice = (data as any).filters?.maxPrice || 999;
  let sortBy = (data as any).filters?.sortBy || 'newest';
  let showFilters = false;
  let showSearch = false;

  // Safe defaults for price range
  const priceMin = (data as any).minPrice || 0;
  const priceMax = (data as any).maxPrice || 999;
  const availableCountries = (data as any).countries || [];

  function maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 8) return cardNumber;
    const first4 = cardNumber.slice(0, 4);
    const last4 = cardNumber.slice(-4);
    const masked = '*'.repeat(cardNumber.length - 8);
    return `${first4}${masked}${last4}`;
  }

  function getCardType(cardNumber: string): string {
    if (!cardNumber) return 'Unknown';
    const bin = cardNumber.slice(0, 1);
    switch (bin) {
      case '4': return 'Visa';
      case '5': return 'Mastercard';
      case '3': return 'American Express';
      case '6': return 'Discover';
      default: return 'Unknown';
    }
  }

  function getCardTypeIcon(cardNumber: string) {
    const type = getCardType(cardNumber);
    switch (type) {
      case 'Visa': return CreditCard;
      case 'Mastercard': return CreditCard;
      case 'American Express': return Shield;
      case 'Discover': return CreditCard;
      default: return CreditCard;
    }
  }

  function getCardTypeColor(cardNumber: string): string {
    const type = getCardType(cardNumber);
    switch (type) {
      case 'Visa': return 'text-blue-400';
      case 'Mastercard': return 'text-red-400';
      case 'American Express': return 'text-green-400';
      case 'Discover': return 'text-orange-400';
      default: return 'text-neutral-400';
    }
  }

  function getBinInfo(cardNumber: string): string {
    if (!cardNumber) return '';
    return cardNumber.slice(0, 6);
  }

  const goToPage = (pageNum: number) => {
    if (pageNum < 1 || pageNum > data.pages || pageNum === data.page) return;
    applyFilters(pageNum);
  };

  const applyFilters = (pageNum: number = 1) => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCardType) params.set('cardType', selectedCardType);
    if (selectedCountry) params.set('country', selectedCountry);
    if (minPrice > priceMin) params.set('minPrice', minPrice.toString());
    if (maxPrice < priceMax) params.set('maxPrice', maxPrice.toString());
    if (sortBy !== 'newest') params.set('sortBy', sortBy);
    if (pageNum > 1) params.set('page', pageNum.toString());
    
    goto(`/cvv?${params.toString()}`);
  };

  const clearFilters = () => {
    searchQuery = '';
    selectedCardType = '';
    selectedCountry = '';
    minPrice = priceMin;
    maxPrice = priceMax;
    sortBy = 'newest';
    applyFilters();
  };

  const hasActiveFilters = (): boolean => {
    return !!(searchQuery || selectedCardType || selectedCountry || 
             minPrice > priceMin || maxPrice < priceMax || sortBy !== 'newest');
  };
</script>

<svelte:head>
  <title>CVV Cards - Browse Credit Cards</title>
</svelte:head>

{#if data.cards?.length === 0}
  <div class="flex items-center justify-center flex-col pt-12">
    <Icon src={Frown} class="w-16 h-16 text-neutral-500 mb-2" />
    <h1 class="font-bold">No CVV Cards Available</h1>
    <span class="text-sm mb-2 block text-neutral-300">
      {#if hasActiveFilters()}
        No cards match your search criteria. Try adjusting your filters.
      {:else}
        Check back later for new cards
      {/if}
    </span>
    {#if hasActiveFilters()}
      <button on:click={clearFilters} class="btn btn-secondary">
        Clear Filters
      </button>
    {/if}
  </div>
{:else}
  <div class="mb-6">
    <h1 class="text-3xl font-bold mb-2">CVV Cards</h1>
    <p class="text-neutral-400">Browse and purchase verified credit card information</p>
  </div>

  <!-- Search and Filter Controls -->
  <div class="mb-6 space-y-4">
    <div class="flex flex-col sm:flex-row gap-4">
      <!-- Search Section -->
      <div class="flex-1">
        <div class="relative">
          <Icon src={Search} class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by card number, BIN, name, country, city, state, or ZIP..."
            class="w-full pl-10 pr-12 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:border-blue-500"
            bind:value={searchQuery}
            on:input={() => applyFilters()}
          />
          <button
            class="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
            on:click={() => showSearch = !showSearch}
          >
            <Icon src={Search} class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Quick Sort -->
      <div class="sm:w-48">
        <select
          class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:border-blue-500"
          bind:value={sortBy}
          on:change={() => applyFilters()}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>

      <!-- Filter Button -->
      <div>
        <button
          class="btn btn-secondary"
          on:click={() => showFilters = !showFilters}
        >
          <Icon src={Filter} class="w-4 h-4 mr-1" />
          Filters
          {#if hasActiveFilters()}
            <span class="ml-1 bg-blue-500 text-xs px-1.5 py-0.5 rounded-full">•</span>
          {/if}
        </button>
      </div>
    </div>

    <!-- Search Help -->
    {#if showSearch}
      <div class="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700">
        <h3 class="font-medium mb-2 flex items-center">
          <Icon src={Search} class="w-4 h-4 mr-2" />
          Search Options
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-300">
          <div>
            <strong>Card Number:</strong> Search by partial card number (e.g., "4111")
            <br><strong>BIN:</strong> Search by Bank Identification Number (first 6 digits)
            <br><strong>Name:</strong> Search by cardholder name
          </div>
          <div>
            <strong>Location:</strong> Search by country (US, CA, UK), state, city
            <br><strong>ZIP:</strong> Search by postal/ZIP code
            <br><strong>Mixed:</strong> Combine multiple criteria in one search
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-neutral-700">
          <strong class="text-blue-400">Examples:</strong>
          <code class="text-xs bg-neutral-700 px-2 py-1 rounded ml-2">4111</code>
          <code class="text-xs bg-neutral-700 px-2 py-1 rounded ml-2">411111</code>
          <code class="text-xs bg-neutral-700 px-2 py-1 rounded ml-2">John Doe</code>
          <code class="text-xs bg-neutral-700 px-2 py-1 rounded ml-2">US</code>
          <code class="text-xs bg-neutral-700 px-2 py-1 rounded ml-2">10001</code>
        </div>
      </div>
    {/if}

    <!-- Advanced Filters -->
    {#if showFilters}
      <div class="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium flex items-center">
            <Icon src={Filter} class="w-4 h-4 mr-2" />
            Advanced Filters
          </h3>
          {#if hasActiveFilters()}
            <button on:click={clearFilters} class="text-sm text-blue-400 hover:text-blue-300">
              Clear All
            </button>
          {/if}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Card Type Filter -->
          <div>
            <label for="card-type-filter" class="block text-sm font-medium mb-1">Card Type</label>
            <select
              id="card-type-filter"
              class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:border-blue-500"
              bind:value={selectedCardType}
              on:change={() => applyFilters()}
            >
              <option value="">All Types</option>
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="amex">American Express</option>
              <option value="discover">Discover</option>
            </select>
          </div>

          <!-- Country Filter -->
          <div>
            <label for="country-filter" class="block text-sm font-medium mb-1">Country</label>
            <select
              id="country-filter"
              class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:border-blue-500"
              bind:value={selectedCountry}
              on:change={() => applyFilters()}
            >
              <option value="">All Countries</option>
              {#each availableCountries as country}
                <option value={country}>{country}</option>
              {/each}
            </select>
          </div>

          <!-- Price Range -->
          <div>
            <label for="min-price" class="block text-sm font-medium mb-1">Min Price</label>
            <input
              id="min-price"
              type="number"
              min={priceMin}
              max={priceMax}
              step="0.01"
              class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:border-blue-500"
              bind:value={minPrice}
              on:change={() => applyFilters()}
            />
          </div>

          <div>
            <label for="max-price" class="block text-sm font-medium mb-1">Max Price</label>
            <input
              id="max-price"
              type="number"
              min={priceMin}
              max={priceMax}
              step="0.01"
              class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:border-blue-500"
              bind:value={maxPrice}
              on:change={() => applyFilters()}
            />
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Results Info -->
  <div class="mb-4 text-sm text-neutral-400">
    Showing {data.cards?.length || 0} of {data.totalCount} cards
    {#if hasActiveFilters()}
      (filtered)
    {/if}
  </div>

  <table class="card w-full overflow-hidden">
    <thead>
      <tr>
        <th>Card Info</th>
        <th>Type & BIN</th>
        <th>Location</th>
        <th>Expiry</th>
        <th>Status</th>
        <th>Price</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#if data.cards}
        {#each data.cards as card}
          <tr>
            <td>
              <div class="flex items-center gap-3">
                <Icon src={getCardTypeIcon(card.cardNumber)} class="w-6 h-6 {getCardTypeColor(card.cardNumber)}" />
                <div>
                  <div class="font-mono text-sm">{maskCardNumber(card.cardNumber)}</div>
                  <div class="text-xs text-neutral-400">
                    {#if card.fullName}
                      {card.fullName}
                    {:else}
                      No name provided
                    {/if}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <div class="flex flex-col">
                <span class="font-medium {getCardTypeColor(card.cardNumber)}">{getCardType(card.cardNumber)}</span>
                <span class="text-xs text-neutral-400">BIN: {getBinInfo(card.cardNumber)}</span>
              </div>
            </td>
            <td>
              <div class="flex flex-col">
                <div class="flex items-center gap-1">
                  <Icon src={MapPin} class="w-3 h-3" />
                  <span class="text-sm">{card.country || 'Unknown'}</span>
                </div>
                {#if card.state}
                  <span class="text-xs text-neutral-400">{card.state} {card.zip || ''}</span>
                {/if}
              </div>
            </td>
            <td>
              <div class="font-mono text-sm">
                {card.expMonth.toString().padStart(2, '0')}/{card.expYear}
              </div>
            </td>
            <td>
              <span class="status-badge status-{card.status.toLowerCase()}">
                {card.status}
              </span>
            </td>
            <td>
              <div class="flex flex-col">
                <span class="font-semibold text-green-400">${card.price.toFixed(2)}</span>
                {#if card.isDiscounted}
                  <span class="text-xs text-orange-400">🏷️ Discounted</span>
                {/if}
              </div>
            </td>
            <td class="flex justify-end">
              <a href="/cvv/{card.id}" class="btn w-max">
                <Icon src={CreditCard} class="w-4 h-4 mr-1" />
                View
              </a>
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="7" class="text-center">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <p>Page</p>
              <input
                type="number"
                value={data.page}
                min={1}
                max={data.pages}
                class="bg-neutral-850 rounded-lg px-2 py-1 w-14 border border-neutral-700"
                on:change={(e) => goToPage(Number((e.target as HTMLInputElement).value))}
              />
              <p>of {data.pages}</p>
            </div>
            <div class="flex items-center gap-2">
              <button class="page-btn" on:click={() => goToPage(data.page - 1)}>
                <Icon src={ChevronLeft} class="w-5 h-5" />
              </button>

              <button class="page-btn" on:click={() => goToPage(data.page + 1)}>
                <Icon src={ChevronRight} class="w-5 h-5" />
              </button>
            </div>
          </div>
        </td>
      </tr>
    </tfoot>
  </table>
{/if}

<style>
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

  .page-btn {
    padding: 0.5rem;
    background-color: rgb(38 38 38);
    border: 1px solid rgb(64 64 64);
    border-radius: 0.5rem;
    color: rgb(163 163 163);
    transition: all 0.2s;
  }

  .page-btn:hover {
    background-color: rgb(64 64 64);
    color: white;
  }

  .page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
