<script lang="ts">
  import { ShoppingCart, User, Eye, Tag } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { cart } from '$lib/stores/cart';
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  export let product: {
    id: number;
    name: string;
    shortDesc?: string;
    price: number;
    stock: string | number;
    type?: string;
    seller?: {
      id: number;
      username: string;
    };
    category?: {
      name: string;
    };
  };
  
  export let showAddToCart = true;
  export let layout: 'card' | 'list' = 'card';
  export let size: 'sm' | 'md' | 'lg' = 'md';

  $: inStock = product.stock === '∞' || (typeof product.stock === 'number' && product.stock > 0) || 
               (typeof product.stock === 'string' && parseInt(product.stock) > 0);

  function handleAddToCart() {
    cart.addItem(product.id, 1, {
      name: product.name,
      price: product.price,
      stock: product.stock,
      type: product.type
    });
  }

  const cardClasses = {
    sm: 'p-3',
    md: 'p-4', 
    lg: 'p-6'
  };
</script>

{#if layout === 'card'}
  <div 
    class="card group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 {cardClasses[size]}"
    in:fade={{ duration: 300, delay: 100 }}
  >
    <!-- Product Header -->
    <div class="flex justify-between items-start mb-3">
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-lg truncate group-hover:text-blue-400 transition-colors">
          <a href="/product/{product.id}" class="hover:underline">
            {product.name}
          </a>
        </h3>
        {#if product.category}
          <span class="inline-flex items-center gap-1 text-xs text-neutral-400 mt-1">
            <Icon src={Tag} class="w-3 h-3" />
            {product.category.name}
          </span>
        {/if}
      </div>
      
      <!-- Stock Badge -->
      <div class="flex items-center gap-2">
        {#if !inStock}
          <span class="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full">
            Out of Stock
          </span>
        {:else if product.stock !== '∞'}
          <span class="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
            {product.stock} left
          </span>
        {/if}
      </div>
    </div>

    <!-- Product Description -->
    {#if product.shortDesc}
      <p class="text-neutral-300 text-sm mb-4 line-clamp-2">
        {product.shortDesc}
      </p>
    {/if}

    <!-- Product Footer -->
    <div class="flex items-center justify-between mt-auto">
      <div class="flex flex-col">
        <span class="text-2xl font-bold text-green-400">
          ${product.price.toFixed(2)}
        </span>
        {#if product.seller}
          <span class="text-xs text-neutral-400 flex items-center gap-1">
            <Icon src={User} class="w-3 h-3" />
            <a href="/seller/{product.seller.id}" class="hover:underline hover:text-white">
              {product.seller.username}
            </a>
          </span>
        {/if}
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2">
        <a 
          href="/product/{product.id}"
          class="btn-secondary px-3 py-2 text-sm flex items-center gap-1"
          title="View Details"
        >
          <Icon src={Eye} class="w-4 h-4" />
          <span class="hidden sm:inline">View</span>
        </a>
        
        {#if showAddToCart && inStock}
          <button
            on:click={handleAddToCart}
            class="btn-primary px-3 py-2 text-sm flex items-center gap-1"
            in:scale={{ duration: 200, easing: quintOut }}
          >
            <Icon src={ShoppingCart} class="w-4 h-4" />
            <span class="hidden sm:inline">Add</span>
          </button>
        {/if}
      </div>
    </div>
  </div>

{:else if layout === 'list'}
  <div class="card p-4 flex items-center gap-4 hover:bg-neutral-800/50 transition-colors">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <h3 class="font-semibold truncate">
          <a href="/product/{product.id}" class="hover:underline hover:text-blue-400">
            {product.name}
          </a>
        </h3>
        {#if product.category}
          <span class="px-2 py-1 text-xs bg-neutral-700 text-neutral-300 rounded">
            {product.category.name}
          </span>
        {/if}
      </div>
      
      {#if product.shortDesc}
        <p class="text-neutral-400 text-sm truncate">{product.shortDesc}</p>
      {/if}
      
      {#if product.seller}
        <span class="text-xs text-neutral-500 flex items-center gap-1 mt-1">
          <Icon src={User} class="w-3 h-3" />
          <a href="/seller/{product.seller.id}" class="hover:underline">
            {product.seller.username}
          </a>
        </span>
      {/if}
    </div>

    <div class="flex items-center gap-4">
      <!-- Stock -->
      <div class="text-sm text-center min-w-[60px]">
        {#if !inStock}
          <span class="text-red-400">Out of Stock</span>
        {:else}
          <span class="text-green-400">{product.stock}</span>
        {/if}
      </div>

      <!-- Price -->
      <div class="text-lg font-bold text-green-400 min-w-[80px] text-right">
        ${product.price.toFixed(2)}
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <a href="/product/{product.id}" class="btn-secondary btn-sm">
          <Icon src={Eye} class="w-4 h-4" />
        </a>
        {#if showAddToCart && inStock}
          <button on:click={handleAddToCart} class="btn-primary btn-sm">
            <Icon src={ShoppingCart} class="w-4 h-4" />
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .btn-primary {
    background-color: rgb(37 99 235);
    color: white;
    border-radius: 0.5rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-primary:hover {
    background-color: rgb(29 78 216);
  }

  .btn-secondary {
    background-color: rgb(64 64 64);
    color: rgb(212 212 212);
    border-radius: 0.5rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-secondary:hover {
    background-color: rgb(82 82 82);
    color: white;
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }

  .card {
    background-color: rgb(23 23 23);
    border: 1px solid rgb(64 64 64);
    border-radius: 0.5rem;
    display: flex;
    flex-direction: column;
  }
</style>
