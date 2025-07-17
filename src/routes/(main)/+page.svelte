<script lang="ts">
  import IconifyIcon from '@iconify/svelte';
  import ProductGrid from '$lib/components/ProductGrid.svelte';
  import AnnouncementBanner from '$lib/components/AnnouncementBanner.svelte';
  import { TrendingUp, Clock, Star, Grid, ArrowRight } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>Dashboard - Welcome back, {data.user.username}!</title>
</svelte:head>

<!-- Welcome Section -->
<div class="mb-8" in:fade={{ duration: 600 }}>
  <h1 class="text-3xl font-bold mb-2">Welcome back, {data.user.username}! 👋</h1>
  <p class="text-neutral-400">Here's what's happening in your marketplace today.</p>
</div>

<!-- User Stats Cards -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  <div 
    class="card relative overflow-hidden group hover:scale-105 transition-transform duration-300"
    in:fly={{ y: 20, duration: 400, delay: 100, easing: quintOut }}
  >
    <IconifyIcon 
      icon="material-symbols:package-2" 
      class="w-16 sm:w-24 lg:w-32 h-16 sm:h-24 lg:h-32 text-green-400 absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 sm:translate-x-1/3 opacity-20 group-hover:opacity-30 transition-opacity" 
    />
    <h3 class="text-sm sm:text-base font-medium text-neutral-300">Your Orders</h3>
    <p class="text-xl sm:text-2xl font-bold text-green-400">{data.orders}</p>
  </div>
  
  <div 
    class="card relative overflow-hidden group hover:scale-105 transition-transform duration-300"
    in:fly={{ y: 20, duration: 400, delay: 200, easing: quintOut }}
  >
    <IconifyIcon
      icon="material-symbols:account-balance-wallet"
      class="w-16 sm:w-24 lg:w-32 h-16 sm:h-24 lg:h-32 text-emerald-400 absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 sm:translate-x-1/3 opacity-20 group-hover:opacity-30 transition-opacity"
    />
    <h3 class="text-sm sm:text-base font-medium text-neutral-300">Balance</h3>
    <p class="text-xl sm:text-2xl font-bold text-emerald-400">${data.user.balance.toFixed(2)}</p>
  </div>

  <div 
    class="card relative overflow-hidden group hover:scale-105 transition-transform duration-300"
    in:fly={{ y: 20, duration: 400, delay: 300, easing: quintOut }}
  >
    <IconifyIcon
      icon="material-symbols:category"
      class="w-16 sm:w-24 lg:w-32 h-16 sm:h-24 lg:h-32 text-blue-400 absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 sm:translate-x-1/3 opacity-20 group-hover:opacity-30 transition-opacity"
    />
    <h3 class="text-sm sm:text-base font-medium text-neutral-300">Categories</h3>
    <p class="text-xl sm:text-2xl font-bold text-blue-400">{data.categoriesWithCounts?.length || 0}</p>
  </div>

  <div 
    class="card relative overflow-hidden group hover:scale-105 transition-transform duration-300"
    in:fly={{ y: 20, duration: 400, delay: 400, easing: quintOut }}
  >
    <IconifyIcon
      icon="material-symbols:storefront"
      class="w-16 sm:w-24 lg:w-32 h-16 sm:h-24 lg:h-32 text-purple-400 absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 sm:translate-x-1/3 opacity-20 group-hover:opacity-30 transition-opacity"
    />
    <h3 class="text-sm sm:text-base font-medium text-neutral-300">Products Available</h3>
    <p class="text-xl sm:text-2xl font-bold text-purple-400">
      {data.categoriesWithCounts?.reduce((sum, cat) => sum + cat.productCount, 0) || 0}
    </p>
  </div>
</div>

<!-- Announcements -->
{#if data.announcements && data.announcements.length > 0}
  <div in:fade={{ duration: 600, delay: 500 }}>
    <AnnouncementBanner announcements={data.announcements} maxVisible={3} autoRotate={true} />
  </div>
{/if}

<!-- Featured Categories -->
{#if data.categoriesWithCounts && data.categoriesWithCounts.length > 0}
  <section class="mb-12" in:fade={{ duration: 600, delay: 600 }}>
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <Icon src={Grid} class="w-6 h-6 text-blue-400" />
        <h2 class="text-2xl font-bold">Browse Categories</h2>
      </div>
    </div>
    
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {#each data.categoriesWithCounts as category, i}
        <a 
          href="/category/{category.id}"
          class="card p-4 text-center hover:scale-105 hover:shadow-lg transition-all duration-300 group"
          in:fly={{ y: 20, duration: 300, delay: i * 50, easing: quintOut }}
        >
          {#if category.image}
            <img 
              src={category.image} 
              alt={category.name}
              class="w-12 h-12 mx-auto mb-3 rounded-lg object-cover group-hover:scale-110 transition-transform" 
            />
          {:else}
            <IconifyIcon 
              icon="material-symbols:category" 
              class="w-12 h-12 mx-auto mb-3 text-blue-400 group-hover:scale-110 transition-transform" 
            />
          {/if}
          <h3 class="font-semibold text-sm mb-1 group-hover:text-blue-400 transition-colors">
            {category.name}
          </h3>
          <p class="text-xs text-neutral-400">
            {category.productCount} product{category.productCount === 1 ? '' : 's'}
          </p>
        </a>
      {/each}
    </div>
  </section>
{/if}

<!-- Top Selling Products -->
{#if data.topSellingProducts && data.topSellingProducts.length > 0}
  <section class="mb-12" in:fade={{ duration: 600, delay: 700 }}>
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <Icon src={TrendingUp} class="w-6 h-6 text-orange-400" />
        <h2 class="text-2xl font-bold">🔥 Top Selling</h2>
      </div>
      <a href="/category/1" class="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2">
        View All
        <Icon src={ArrowRight} class="w-4 h-4" />
      </a>
    </div>
    
    <ProductGrid 
      products={data.topSellingProducts} 
      columns={3}
      showLayoutToggle={false}
      layout="grid"
    />
  </section>
{/if}

<!-- Recent Products -->
{#if data.recentProducts && data.recentProducts.length > 0}
  <section class="mb-12" in:fade={{ duration: 600, delay: 800 }}>
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <Icon src={Clock} class="w-6 h-6 text-green-400" />
        <h2 class="text-2xl font-bold">✨ Recently Added</h2>
      </div>
      <a href="/category/1" class="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2">
        View All
        <Icon src={ArrowRight} class="w-4 h-4" />
      </a>
    </div>
    
    <ProductGrid 
      products={data.recentProducts} 
      columns={3}
      showLayoutToggle={false}
      layout="grid"
    />
  </section>
{/if}

<!-- Featured Products -->
{#if data.featuredProducts && data.featuredProducts.length > 0}
  <section class="mb-12" in:fade={{ duration: 600, delay: 900 }}>
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <Icon src={Star} class="w-6 h-6 text-yellow-400" />
        <h2 class="text-2xl font-bold">🛍️ Featured Products</h2>
      </div>
      <a href="/category/1" class="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2">
        View All
        <Icon src={ArrowRight} class="w-4 h-4" />
      </a>
    </div>
    
    <ProductGrid 
      products={data.featuredProducts} 
      columns={4}
      showLayoutToggle={false}
      layout="grid"
    />
  </section>
{/if}

<!-- Quick Actions -->
<section class="mb-8" in:fade={{ duration: 600, delay: 1000 }}>
  <h2 class="text-xl font-bold mb-4">Quick Actions</h2>
  
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <a 
      href="/orders" 
      class="card p-4 text-center hover:scale-105 hover:bg-neutral-800 transition-all duration-300 group"
    >
      <IconifyIcon icon="material-symbols:package-2" class="w-8 h-8 mx-auto mb-2 text-green-400 group-hover:scale-110 transition-transform" />
      <span class="text-sm font-medium">View Orders</span>
    </a>
    
    <a 
      href="/balance" 
      class="card p-4 text-center hover:scale-105 hover:bg-neutral-800 transition-all duration-300 group"
    >
      <IconifyIcon icon="material-symbols:account-balance-wallet" class="w-8 h-8 mx-auto mb-2 text-emerald-400 group-hover:scale-110 transition-transform" />
      <span class="text-sm font-medium">Add Funds</span>
    </a>
    
    <a 
      href="/cart" 
      class="card p-4 text-center hover:scale-105 hover:bg-neutral-800 transition-all duration-300 group"
    >
      <IconifyIcon icon="material-symbols:shopping-cart" class="w-8 h-8 mx-auto mb-2 text-orange-400 group-hover:scale-110 transition-transform" />
      <span class="text-sm font-medium">View Cart</span>
    </a>
    
    <a 
      href="/cvv" 
      class="card p-4 text-center hover:scale-105 hover:bg-neutral-800 transition-all duration-300 group"
    >
      <IconifyIcon icon="material-symbols:credit-card" class="w-8 h-8 mx-auto mb-2 text-blue-400 group-hover:scale-110 transition-transform" />
      <span class="text-sm font-medium">CVV Cards</span>
    </a>
  </div>
</section>

<style>
  .card {
    background-color: rgb(23 23 23);
    border-radius: 0.5rem;
    border: 1px solid rgb(64 64 64);
    padding: 1rem;
  }
</style>
