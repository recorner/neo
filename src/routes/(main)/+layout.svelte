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
  import { SvelteToast } from '@zerodevx/svelte-toast';
  import classnames from 'classnames';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  export let data: LayoutServerData;
  let mobileMenu = false;

  $: browser && localStorage.setItem('mobileMenu', JSON.stringify(mobileMenu));
  onMount(() => {
    mobileMenu = window.innerHeight < 768 && JSON.parse(localStorage.getItem('mobileMenu') || 'false');
  });
</script>

<svelte:window
  on:resize={() => {
    if (window.innerWidth > 768) {
      mobileMenu = false;
    }
  }}
/>

<SvelteToast />

<aside
  class={classnames('fixed h-screen left-0 px-2 py-6 bg-neutral-850 shadow-md', {
    'w-64': !mobileMenu,
    mobile: mobileMenu,
  })}
>
  <img src={Logo} alt="Logo" class="w-8 h-8 mb-4 mx-4" />
  <nav class="grid gap-1">
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
      <a href={`/category/${category.id}`} class="link">
        {#if category.image}
          <img src={category.image} alt="" class="icon" />
        {:else}
          <Icon src={ShoppingCart} class="icon" />
        {/if}
        <span>{category.name}</span>
      </a>
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

<div class={classnames({ 'pl-64': !mobileMenu, 'pl-20': mobileMenu })}>
  <div class="bg-neutral-800/25 p-3 flex items-center justify-between gap-1">
    <div>
      <button type="button" class="link md:!hidden" on:click={() => (mobileMenu = !mobileMenu)}>
        <Icon src={Menu} class="icon" />
      </button>
    </div>
    <div class="flex gap-1">
      <a href="/balance" class="link">${data.user.balance.toFixed(2)}</a>
      <a href="/cart" class="link group-focus-within:bg-neutral-800">
        <span>{data.cart.reduce((acc, cur) => acc + cur.quantity, 0)}</span>
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
  <div class="p-4">
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
