<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import { cart } from '$lib/stores/cart';
  import toastThemes from '$lib/toastThemes';
  import { AlertTriangle, ShoppingCart, Trash, Plus, Minus, CreditCard, ArrowLeft } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { toast } from '@zerodevx/svelte-toast';
  import { fade, slide, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import type { PageData } from './$types';

  export let data: PageData;
  
  let isProcessing = false;

  // Calculate totals
  $: subtotal = data.products.reduce((acc, item) => acc + item.price * item.quantity, 0);
  $: totalItems = data.products.reduce((acc, item) => acc + item.quantity, 0);

  function updateQuantity(productId: number, newQuantity: number) {
    const product = data.products.find(p => p.id === productId);
    if (!product) return;
    
    const maxQuantity = typeof product.stock === 'number' ? product.stock : 1;
    if (newQuantity < 1 || newQuantity > maxQuantity) return;
    
    product.quantity = newQuantity;
    data.products = [...data.products]; // Trigger reactivity
  }

  function removeProduct(productId: number) {
    data.products = data.products.filter(p => p.id !== productId);
    toast.push('Item removed from cart', {
      theme: toastThemes.success,
    });
  }
</script>

<svelte:head>
  <title>Shopping Cart ({totalItems} items) - ${subtotal.toFixed(2)}</title>
</svelte:head>

<div class="max-w-6xl mx-auto">
  <!-- Header -->
  <div class="flex items-center gap-4 mb-8" in:fade={{ duration: 400 }}>
    <a 
      href="/"
      class="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
      title="Continue Shopping"
    >
      <Icon src={ArrowLeft} class="w-5 h-5" />
    </a>
    <div>
      <h1 class="text-3xl font-bold">Shopping Cart</h1>
      <p class="text-neutral-400">
        {totalItems} item{totalItems === 1 ? '' : 's'} in your cart
      </p>
    </div>
  </div>

  {#if data.products.length === 0}
    <div 
      class="flex items-center justify-center flex-col py-16 text-center"
      in:fade={{ duration: 600 }}
    >
      <div class="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center mb-6">
        <Icon src={ShoppingCart} class="w-12 h-12 text-neutral-500" />
      </div>
      <h2 class="text-2xl font-bold mb-2">Your cart is empty</h2>
      <p class="text-neutral-400 mb-6 max-w-md">
        Looks like you haven't added any products to your cart yet. Browse our categories to find something you like!
      </p>
      <a 
        href="/"
        class="btn bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
      >
        <Icon src={ShoppingCart} class="w-5 h-5" />
        Start Shopping
      </a>
    </div>
  {:else}
    <form
      class="flex gap-8 flex-col xl:flex-row"
      method="post"
      action="?/checkout"
      use:enhance={() => {
        isProcessing = true;
        return async ({ result }) => {
          isProcessing = false;
          if (result.type == 'failure') {
            if (result.data.error === 'changed' || result.data.error === 'invalid') {
              toast.push('Some items in your cart are no longer available', {
                theme: toastThemes.error,
              });
              await invalidateAll();
            } else if (result.data.error === 'insufficient') {
              toast.push('Insufficient funds. Please add money to your account.', {
                theme: toastThemes.error,
              });
            } else {
              toast.push('An error occurred during checkout', {
                theme: toastThemes.error,
              });
            }
          } else if (result.type === 'success') {
            await invalidateAll();
            
            // Clear cart after successful checkout
            cart.clear({ 
              showToast: false // Don't show cart clear toast since we're showing order success
            });
            
            toast.push('Order placed successfully!', {
              theme: toastThemes.success,
            });
            
            // Navigate to orders page
            goto('/orders');
          }
        };
      }}
    >
      <!-- Cart Items -->
      <div class="flex-1 space-y-4">
        <div class="card">
          <div class="border-b border-neutral-700 pb-4 mb-4">
            <h2 class="text-xl font-semibold">Review Your Items</h2>
            <p class="text-sm text-neutral-400">Make sure everything looks good before checkout</p>
          </div>

          <div class="space-y-4">
            {#each data.products as item, i (item.id)}
              <div
                class="flex gap-4 p-4 bg-neutral-800/50 rounded-lg hover:bg-neutral-800/70 transition-colors"
                in:slide={{ duration: 300, delay: i * 50, easing: quintOut }}
                out:scale={{ duration: 200, easing: quintOut }}
              >
                <input type="hidden" name="products" value={item.id} />
                <input type="hidden" name="quantities" value={item.quantity} />

                <!-- Product Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-4 mb-2">
                    <div class="flex-1">
                      <h3 class="font-semibold text-lg leading-tight">
                        <a 
                          href="/product/{item.id}"
                          class="hover:text-blue-400 transition-colors"
                        >
                          {item.name}
                        </a>
                      </h3>
                      <p class="text-sm text-neutral-400 flex items-center gap-2 mt-1">
                        <span class="px-2 py-1 bg-neutral-700 rounded text-xs">
                          {item.category.name}
                        </span>
                        <span class="text-xs">
                          {item.type === 'DOWNLOAD' ? 'Digital Download' : 'License Key'}
                        </span>
                      </p>
                    </div>
                    
                    <!-- Remove Button -->
                    <button
                      type="button"
                      on:click={() => removeProduct(item.id)}
                      class="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                      title="Remove from cart"
                    >
                      <Icon src={Trash} class="w-4 h-4 text-neutral-400 group-hover:text-red-400" />
                    </button>
                  </div>

                  <!-- Price and Quantity Controls -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                      <!-- Quantity Controls -->
                      <div class="flex items-center gap-2 bg-neutral-700 rounded-lg p-1">
                        <button
                          type="button"
                          on:click={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          class="p-1 hover:bg-neutral-600 rounded transition-colors disabled:opacity-50"
                        >
                          <Icon src={Minus} class="w-3 h-3" />
                        </button>
                        
                        <input
                          type="number"
                          bind:value={item.quantity}
                          min={1}
                          max={typeof item.stock === 'number' ? item.stock : 1}
                          class="bg-transparent text-center w-12 font-mono text-sm"
                          on:change={(e) => updateQuantity(item.id, parseInt((e.target as HTMLInputElement).value) || 1)}
                        />
                        
                        <button
                          type="button"
                          on:click={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= (typeof item.stock === 'number' ? item.stock : 1)}
                          class="p-1 hover:bg-neutral-600 rounded transition-colors disabled:opacity-50"
                        >
                          <Icon src={Plus} class="w-3 h-3" />
                        </button>
                      </div>

                      <span class="text-sm text-neutral-400">
                        × ${item.price.toFixed(2)} each
                      </span>
                    </div>

                    <!-- Item Total -->
                    <div class="text-right">
                      <div class="text-lg font-semibold text-green-400">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      {#if item.quantity > 1}
                        <div class="text-xs text-neutral-400">
                          {item.quantity} × ${item.price.toFixed(2)}
                        </div>
                      {/if}
                    </div>
                  </div>

                  <!-- Stock Warning -->
                  {#if typeof item.stock === 'number' && item.stock < 5}
                    <div class="mt-2 flex items-center gap-2 text-yellow-400 text-sm">
                      <Icon src={AlertTriangle} class="w-4 h-4" />
                      <span>Only {item.stock} left in stock</span>
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Checkout Summary -->
      <div class="xl:w-96 flex-shrink-0">
        <div class="card sticky top-4">
          <h2 class="text-xl font-semibold mb-4">Order Summary</h2>
          
          <!-- Order Details -->
          <div class="space-y-3 mb-6">
            <div class="flex justify-between text-sm">
              <span class="text-neutral-400">Items ({totalItems}):</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-neutral-400">Processing Fee:</span>
              <span class="text-green-400">FREE</span>
            </div>
            <div class="border-t border-neutral-700 pt-3">
              <div class="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span class="text-green-400">${subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Account Balance Warning -->
          {#if data.user && subtotal > data.user.balance}
            <div class="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div class="flex items-center gap-2 text-red-400 text-sm mb-1">
                <Icon src={AlertTriangle} class="w-4 h-4" />
                <span class="font-medium">Insufficient Balance</span>
              </div>
              <p class="text-xs text-red-300/80">
                You need ${(subtotal - (data.user?.balance || 0)).toFixed(2)} more to complete this order.
              </p>
              <a 
                href="/balance"
                class="text-red-400 hover:text-red-300 text-xs underline mt-1 inline-block"
              >
                Add funds to your account →
              </a>
            </div>
          {/if}

          <!-- Checkout Button -->
          <button
            type="submit"
            disabled={isProcessing || (data.user && subtotal > data.user.balance)}
            class="w-full btn bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-400 text-white py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium"
          >
            <Icon src={CreditCard} class="w-5 h-5" />
            {#if isProcessing}
              Processing...
            {:else if data.user && subtotal > data.user.balance}
              Insufficient Balance
            {:else}
              Complete Order
            {/if}
          </button>

          <!-- Security Info -->
          <div class="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div class="flex items-center gap-2 text-green-400 text-sm">
              <Icon src={CreditCard} class="w-4 h-4" />
              <span class="font-medium">Secure Checkout</span>
            </div>
            <p class="text-xs text-green-300/80 mt-1">
              Your order will be processed instantly and securely.
            </p>
          </div>
        </div>
      </div>
    </form>
  {/if}
</div>

<style>
  .card {
    background-color: rgb(23 23 23);
    border-radius: 0.5rem;
    border: 1px solid rgb(64 64 64);
    padding: 1.5rem;
  }

  .btn {
    font-weight: 500;
    transition: all 0.2s;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .btn:disabled {
    cursor: not-allowed;
  }
</style>
