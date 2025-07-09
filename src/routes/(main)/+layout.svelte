<script lang="ts">
  import Logo from '$lib/logo.svg';
  import {
    Box,
    DollarSign,
    Home,
    List,
    Menu,
    PieChart,
    Settings,
    ShoppingCart,
    Tool,
    User,
  } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import type { LayoutServerData } from './$types';
  import classnames from 'classnames';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  export let data: LayoutServerData;
  let mobileMenu = false;
  let isMobile = false;

  $: browser && localStorage.setItem('mobileMenu', JSON.stringify(mobileMenu));
  
  onMount(() => {
    isMobile = window.innerWidth < 768;
    mobileMenu = isMobile ? false : JSON.parse(localStorage.getItem('mobileMenu') || 'false');
  });
</script>

<svelte:window
  on:resize={() => {
    isMobile = window.innerWidth < 768;
    if (!isMobile) {
      mobileMenu = JSON.parse(localStorage.getItem('mobileMenu') || 'false');
    }
  }}
/>

<!-- Mobile menu overlay -->
{#if isMobile && mobileMenu}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 z-30"
    role="button"
    tabindex="0"
    on:click={() => (mobileMenu = false)}
    on:keydown={(e) => e.key === 'Escape' && (mobileMenu = false)}
  ></div>
{/if}

<aside
  class={classnames('fixed h-screen left-0 px-2 py-6 bg-neutral-850 shadow-md z-40 overflow-y-auto transition-transform duration-300', {
    'w-64': !mobileMenu,
    'w-20': mobileMenu,
    'mobile': mobileMenu,
    '-translate-x-full': isMobile && !mobileMenu,
    'translate-x-0': !isMobile || mobileMenu
  })}
>
  <img src={Logo} alt="Logo" class="w-8 h-8 mb-4 mx-4" />
  <nav class="grid gap-1 pb-4">
    <a href="/" class="link">
      <Icon src={Home} class="icon" />
      <span>Home</span>
    </a>
    <a href="/orders" class="link">
      <Icon src={Box} class="icon" />
      <span>Orders</span>
    </a>
    <div class="divider">
      <hr />
      <span>Categories</span>
      <hr />
    </div>
    {#each data.categories as category}
      {#if category.name.toLowerCase() === 'cvv'}
        <!-- CVV Category with dropdown -->
        <div class="relative group">
          <button class="link group-focus-within:bg-neutral-800 w-full">
            {#if category.image}
              <img src={category.image} alt="" class="icon" />
            {:else}
              <div class="icon flex items-center justify-center text-lg">💳</div>
            {/if}
            <span>{category.name}</span>
            <Icon src={Menu} class="icon ml-auto transform group-focus-within:rotate-180 transition-transform" />
          </button>
          <div class="absolute z-20 top-12 left-0 w-52 bg-neutral-850 shadow-md rounded-lg px-3 py-2 origin-top-left scale-0 group-focus-within:scale-100 transition opacity-0 group-focus-within:opacity-100">
            <a href={`/category/${category.id}`} class="link">Browse Cards</a>
            {#if data.user.role.includes('SELLER') || data.user.role.includes('ADMIN')}
              <a href="/cvv/upload" class="link">Upload Cards</a>
              <a href="/cvv/seller/dashboard" class="link">CVV Dashboard</a>
            {/if}
          </div>
        </div>
      {:else}
        <a href={`/category/${category.id}`} class="link">
          {#if category.image}
            <img src={category.image} alt="" class="icon" />
          {:else}
            <Icon src={ShoppingCart} class="icon" />
          {/if}
          <span>{category.name}</span>
        </a>
      {/if}
    {:else}
      {#if !mobileMenu}
        <span class="ml-3 text-sm">No categories</span>
      {/if}
    {/each}
    
    {#if data.user.role.includes('SELLER')}
      <div class="divider">
        <hr />
        <span>Seller</span>
        <hr />
      </div>
      <a href="/seller/dashboard" class="link">
        <Icon src={Tool} class="icon" />
        <span>Dashboard</span>
      </a>
      <a href="/seller/products" class="link">
        <Icon src={List} class="icon" />
        <span>Products</span>
      </a>
    {/if}
    {#if data.user.role.includes('ADMIN')}
      <div class="divider">
        <hr />
        <span>Administration</span>
        <hr />
      </div>
      <!-- <a href="/admin/analytics" class="link">
        <Icon src={PieChart} class="icon" />
        <span>Analytics</span>
      </a> -->
      <a href="/admin/users" class="link">
        <Icon src={User} class="icon" />
        <span>Users</span>
      </a>
      <a href="/admin/payouts" class="link">
        <Icon src={DollarSign} class="icon" />
        <span>Payouts</span>
      </a>
      <a href="/admin/settings" class="link">
        <Icon src={Settings} class="icon" />
        <span>Settings</span>
      </a>
    {/if}
  </nav>
</aside>

<div class={classnames('transition-all duration-300', {
  'md:pl-64': !mobileMenu,
  'md:pl-20': mobileMenu,
  'pl-0': true
})}>
  <div class="bg-neutral-800/25 p-3 flex items-center justify-between gap-1 relative z-30">
    <div>
      <button 
        type="button" 
        class="link md:hidden" 
        on:click={() => (mobileMenu = !mobileMenu)}
      >
        <Icon src={Menu} class="icon" />
      </button>
    </div>
    <div class="flex gap-1 flex-wrap">
      <a href="/balance" class="link text-xs sm:text-sm">${data.user.balance.toFixed(2)}</a>
      <a href="/cart" class="link group-focus-within:bg-neutral-800">
        <span class="text-xs sm:text-sm">{data.cart.reduce((acc, cur) => acc + cur.quantity, 0)}</span>
        <Icon src={ShoppingCart} class="icon" />
      </a>
      <div class="relative group">
        <button class="link group-focus-within:bg-neutral-800">
          <span>{data.user.username}</span>
          <Icon src={User} class="icon" />
        </button>
        <div
          class="absolute z-20 top-10 right-0 w-52 bg-neutral-850 shadow-md rounded-lg px-3 py-2 origin-top-right scale-0 group-focus-within:scale-100 transition opacity-0 group-focus-within:opacity-100"
        >
          <a href="/account" class="link">Settings</a>
          <a href="/auth/logout" class="link">Logout</a>
        </div>
      </div>
    </div>
  </div>
  <div class="p-2 sm:p-4 overflow-x-auto">
    <slot />
  </div>
</div>

<style>
  .link {
    @apply px-3 py-2 hover:bg-neutral-800 transition rounded-lg flex items-center gap-3 text-sm;
  }

  .divider {
    @apply flex items-center gap-2 py-2 px-3;
  }

  .divider > span {
    @apply text-xs text-neutral-500 uppercase;
  }

  .mobile > nav > .divider > span,
  .mobile > nav > .divider > hr:last-child,
  .mobile > nav > a > span {
    @apply hidden;
  }

  :global(.mobile > nav > a > .icon) {
    @apply w-6 h-6 mx-auto;
  }

  .divider > hr {
    @apply border-neutral-700 w-full;
  }

  :global(.icon) {
    @apply w-4 h-4;
  }
</style>
