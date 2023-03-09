<script lang="ts">
  import Logo from '$lib/logo.svg';
  import { Box, DollarSign, Home, List, PieChart, Settings, ShoppingCart, Tool, User } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import type { LayoutServerData } from './$types';
  import { SvelteToast } from '@zerodevx/svelte-toast';

  export let data: LayoutServerData;
</script>

<SvelteToast />

<aside class="fixed h-screen left-0 w-64 px-2 py-6 bg-neutral-850 shadow-md">
  <img src={Logo} alt="Logo" class="w-8 h-8 mb-4 ml-3" />
  <nav class="grid gap-1">
    <a href="/" class="link">
      <Icon src={Home} class="w-4 h-4" />
      <span>Home</span>
    </a>
    <a href="/orders" class="link">
      <Icon src={Box} class="w-4 h-4" />
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
        <img src="{category.image}" alt="" class="w-4 h-4" />
        {:else}
        <Icon src={ShoppingCart} class="w-4 h-4" />
        {/if}
        <span>{category.name}</span>
      </a>
    {:else}
      <span class="ml-3 text-sm">No categories</span>
    {/each}
    <div class="divider">
      <hr />
      <span>Seller</span>
      <hr />
    </div>
    <a href="/seller/dashboard" class="link">
      <Icon src={Tool} class="w-4 h-4" />
      <span>Dashboard</span>
    </a>
    <a href="/seller/products" class="link">
      <Icon src={List} class="w-4 h-4" />
      <span>Products</span>
    </a>
    <div class="divider">
      <hr />
      <span>Administration</span>
      <hr />
    </div>
    <a href="/admin/analytics" class="link">
      <Icon src={PieChart} class="w-4 h-4" />
      <span>Analytics</span>
    </a>
    <a href="/admin/users" class="link">
      <Icon src={User} class="w-4 h-4" />
      <span>Users</span>
    </a>
    <a href="/admin/payouts" class="link">
      <Icon src={DollarSign} class="w-4 h-4" />
      <span>Payouts</span>
    </a>
    <a href="/admin/settings" class="link">
      <Icon src={Settings} class="w-4 h-4" />
      <span>Settings</span>
    </a>
  </nav>
</aside>

<div class="ml-64">
  <div class="bg-neutral-800/25 p-3 flex items-center justify-end gap-1">
    <a href="/balance" class="link">${data.user.balance.toFixed(2)}</a>
    <a href="/cart" class="link group-focus-within:bg-neutral-800">
      <span>{data.cart.reduce((acc, cur) => acc + cur.quantity, 0)}</span>
      <Icon src={ShoppingCart} class="w-4 h-4" />
    </a>
    <div class="relative group">
      <button class="link group-focus-within:bg-neutral-800">
        <span>{data.user.username}</span>
        <Icon src={User} class="w-4 h-4" />
      </button>
      <div
        class="absolute z-20 top-10 right-0 w-52 bg-neutral-850 shadow-md rounded-lg px-3 py-2 origin-top-right scale-0 group-focus-within:scale-100 transition opacity-0 group-focus-within:opacity-100"
      >
        <a href="/account" class="link">Settings</a>
        <a href="/auth/logout" class="link">Logout</a>
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

  .divider > hr {
    @apply border-neutral-700 w-full;
  }
</style>
