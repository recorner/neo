<script lang="ts">
  import { cart, cartTotals, type CartItem } from '$lib/stores/cart';
  import { ShoppingCart, Plus, Minus, X, CreditCard } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { slide, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  export let isOpen = false;
  export let showCheckoutButton = true;

  $: cartItems = $cart;
  $: totals = $cartTotals;

  function updateQuantity(productId: number, quantity: number) {
    cart.updateQuantity(productId, quantity, { showToast: true });
  }

  function removeItem(productId: number) {
    cart.removeItem(productId, { showToast: true });
  }

  function handleCheckout() {
    // Navigate to checkout page
    window.location.href = '/cart';
  }
</script>

<!-- Cart Dropdown Trigger -->
<div class="relative">
  <button
    on:click={() => isOpen = !isOpen}
    class="link relative"
    class:active={isOpen}
  >
    <span class="text-xs font-bold min-w-[20px] text-center">
      {totals.quantity}
    </span>
    <Icon src={ShoppingCart} class="icon text-orange-400" />
    
    <!-- Cart Badge -->
    {#if totals.quantity > 0}
      <span 
        class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
        in:fade={{ duration: 200 }}
      >
        {totals.quantity}
      </span>
    {/if}
  </button>

  <!-- Cart Dropdown - Mobile Optimized -->
  {#if isOpen}
    <div
      class="absolute top-12 z-50 max-h-96 overflow-hidden bg-neutral-850 border border-neutral-700 rounded-lg shadow-xl
             sm:right-0 sm:w-80 sm:translate-x-0
             right-1/2 translate-x-1/2 sm:translate-x-0 w-[calc(100vw-3rem)] sm:w-80 max-w-sm"
      in:slide={{ duration: 200, easing: quintOut }}
      out:slide={{ duration: 150, easing: quintOut }}
    >
      <!-- Cart Header -->
      <div class="p-4 border-b border-neutral-700 flex items-center justify-between">
        <h3 class="font-semibold text-lg">Shopping Cart</h3>
        <button
          on:click={() => isOpen = false}
          class="text-neutral-400 hover:text-white transition-colors p-1"
        >
          <Icon src={X} class="w-4 h-4" />
        </button>
      </div>

      <!-- Cart Items -->
      <div class="max-h-64 overflow-y-auto">
        {#if cartItems.length === 0}
          <div class="p-8 text-center">
            <Icon src={ShoppingCart} class="w-12 h-12 text-neutral-500 mx-auto mb-3" />
            <p class="text-neutral-400 mb-2">Your cart is empty</p>
            <p class="text-sm text-neutral-500">Add some products to get started</p>
          </div>
        {:else}
          <div class="p-2 space-y-2">
            {#each cartItems as item (item.id)}
              <div
                class="bg-neutral-800 rounded-lg p-3 flex items-center gap-3"
                in:fade={{ duration: 200 }}
                out:fade={{ duration: 150 }}
              >
                <!-- Product Info -->
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-sm truncate">{item.name || `Product #${item.id}`}</h4>
                  <p class="text-xs text-neutral-400">
                    ${(item.price || 0).toFixed(2)} each
                  </p>
                </div>

                <!-- Quantity Controls -->
                <div class="flex items-center gap-1">
                  <button
                    on:click={() => updateQuantity(item.id, item.quantity - 1)}
                    class="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition-colors"
                    disabled={item.quantity <= 1}
                  >
                    <Icon src={Minus} class="w-3 h-3" />
                  </button>
                  
                  <span class="w-8 text-center text-sm font-mono">
                    {item.quantity}
                  </span>
                  
                  <button
                    on:click={() => updateQuantity(item.id, item.quantity + 1)}
                    class="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition-colors"
                  >
                    <Icon src={Plus} class="w-3 h-3" />
                  </button>
                </div>

                <!-- Remove Button -->
                <button
                  on:click={() => removeItem(item.id)}
                  class="p-1 hover:bg-red-500/20 rounded text-neutral-400 hover:text-red-400 transition-colors"
                  title="Remove item"
                >
                  <Icon src={X} class="w-3 h-3" />
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Cart Footer -->
      {#if cartItems.length > 0}
        <div class="p-4 border-t border-neutral-700 space-y-3">
          <!-- Total -->
          <div class="flex justify-between items-center text-lg font-semibold">
            <span>Total:</span>
            <span class="text-green-400">${totals.total.toFixed(2)}</span>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-2">
            <a
              href="/cart"
              class="w-full btn bg-neutral-700 hover:bg-neutral-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              on:click={() => isOpen = false}
            >
              <Icon src={ShoppingCart} class="w-4 h-4" />
              View Cart
            </a>
            
            {#if showCheckoutButton}
              <button
                on:click={handleCheckout}
                class="w-full btn bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Icon src={CreditCard} class="w-4 h-4" />
                Checkout
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Overlay to close cart when clicking outside -->
{#if isOpen}
  <div
    class="fixed inset-0 z-40"
    role="button"
    tabindex="0"
    on:click={() => isOpen = false}
    on:keydown={(e) => e.key === 'Escape' && (isOpen = false)}
    transition:fade={{ duration: 150 }}
  ></div>
{/if}

<style>
  .link {
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    position: relative;
    overflow: hidden;
    transition: all 0.2s;
  }

  .link:hover {
    background-color: rgb(38 38 38);
  }

  .link.active {
    background-color: rgb(38 38 38);
  }

  :global(.icon) {
    width: 1rem;
    height: 1rem;
    transition: color 0.2s;
  }

  .btn {
    font-weight: 500;
    transition: all 0.2s;
    font-size: 0.875rem;
  }
</style>