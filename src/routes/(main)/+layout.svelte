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
    Clock,
    MessageCircle,
  } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import IconifyIcon from '@iconify/svelte';
  import IconPreloader from '$lib/components/IconPreloader.svelte';
  import QuickIcon from '$lib/components/QuickIcon.svelte';
  import type { LayoutServerData } from './$types';
  import classnames from 'classnames';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  export let data: LayoutServerData;
  let mobileMenu = false;
  let isMobile = false;
  let currentTime = '';
  let timeInterval: any;

  // Russian time zone (Moscow)
  const updateRussianTime = () => {
    const now = new Date();
    const russianTime = new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(now);
    currentTime = russianTime;
  };

  $: browser && localStorage.setItem('mobileMenu', JSON.stringify(mobileMenu));
  
  onMount(() => {
    isMobile = window.innerWidth < 768;
    mobileMenu = isMobile ? false : JSON.parse(localStorage.getItem('mobileMenu') || 'false');
    
    // Update time immediately and then every second
    updateRussianTime();
    timeInterval = setInterval(updateRussianTime, 1000);
    
    return () => {
      if (timeInterval) clearInterval(timeInterval);
    };
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

<!-- Icon Preloader -->
<IconPreloader />

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
      <QuickIcon icon="material-symbols:home" className="icon text-blue-400" />
      <span>Home</span>
    </a>
    <a href="/orders" class="link">
      <QuickIcon icon="material-symbols:package-2" className="icon text-green-400" />
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
        {:else if category.name.toLowerCase().includes('cvv') || category.name.toLowerCase().includes('card')}
          <IconifyIcon icon="material-symbols:credit-card" class="icon text-orange-400" />
        {:else}
          <IconifyIcon icon="material-symbols:shopping-cart" class="icon text-orange-400" />
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
        <IconifyIcon icon="material-symbols:dashboard" class="icon text-indigo-400" />
        <span>Dashboard</span>
      </a>
      <a href="/seller/products" class="link">
        <IconifyIcon icon="material-symbols:inventory-2" class="icon text-cyan-400" />
        <span>Products</span>
      </a>
    {/if}
    {#if data.user.role.includes('ADMIN')}
      <div class="divider">
        <hr />
        <span>Administration</span>
        <hr />
      </div>
      <a href="/admin/users" class="link">
        <IconifyIcon icon="material-symbols:group" class="icon text-pink-400" />
        <span>Users</span>
      </a>
      <a href="/admin/deposits" class="link">
        <IconifyIcon icon="material-symbols:account-balance-wallet" class="icon text-green-400" />
        <span>Deposit History</span>
      </a>
      <a href="/admin/payouts" class="link">
        <IconifyIcon icon="material-symbols:payments" class="icon text-emerald-400" />
        <span>Payouts</span>
      </a>
      <a href="/admin/settings" class="link">
        <IconifyIcon icon="material-symbols:settings" class="icon text-slate-400" />
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
  <div class="bg-neutral-800/25 p-3 flex items-center justify-between gap-2 relative z-30">
    <div class="flex items-center gap-2">
      <button 
        type="button" 
        class="link md:hidden" 
        on:click={() => (mobileMenu = !mobileMenu)}
      >
        <QuickIcon icon="material-symbols:menu" className="icon text-neutral-300" />
      </button>
      
      <!-- Russian Time Display -->
      <div class="hidden sm:flex items-center gap-2 text-xs bg-neutral-800/50 px-3 py-1 rounded-lg">
        <QuickIcon icon="material-symbols:schedule" className="w-3 h-3 text-blue-400" />
        <span class="font-mono">{currentTime}</span>
        <span class="text-neutral-400">MSK</span>
      </div>
    </div>
    
    <div class="flex gap-1 flex-wrap items-center min-w-0">
      <!-- Country Flags - Hide on small screens -->
      <div class="hidden lg:flex gap-1">
        <button class="p-1 hover:bg-neutral-800 rounded transition" title="Russian Time Zone">
          🇷🇺
        </button>
        <button class="p-1 hover:bg-neutral-800 rounded transition" title="USA">
          🇺🇸
        </button>
      </div>
      
      <!-- Telegram Support - Hide text on smaller screens -->
      <a 
        href="https://t.me/{import.meta.env.VITE_TELEGRAM_SUPPORT || 'support'}" 
        target="_blank" 
        class="link text-xs bg-blue-600 hover:bg-blue-700 transition"
        title="Contact Support"
      >
        <IconifyIcon icon="ic:baseline-telegram" class="icon text-white" />
        <span class="hidden xl:inline">Support</span>
      </a>
      
      <!-- Balance - More responsive -->
      <a href="/balance" class="link text-xs">
        <IconifyIcon icon="material-symbols:account-balance-wallet" class="icon text-green-400" />
        <span class="hidden md:inline">${data.user.balance.toFixed(2)}</span>
        <span class="md:hidden">${data.user.balance.toFixed(0)}</span>
      </a>
      
      <!-- Cart -->
      <a href="/cart" class="link group-focus-within:bg-neutral-800">
        <span class="text-xs">{data.cart.reduce((acc, cur) => acc + cur.quantity, 0)}</span>
        <IconifyIcon icon="material-symbols:shopping-cart" class="icon text-orange-400" />
      </a>
      
      <!-- User menu with truncated username -->
      <div class="relative group min-w-0">
        <button class="link group-focus-within:bg-neutral-800 min-w-0">
          <span class="truncate max-w-20 sm:max-w-24 md:max-w-32" title={data.user.username}>
            {data.user.username}
          </span>
          <QuickIcon icon="material-symbols:account-circle" className="icon text-blue-400 flex-shrink-0" />
        </button>
        <div
          class="absolute z-20 top-10 right-0 w-52 bg-neutral-850 shadow-md rounded-lg px-3 py-2 origin-top-right scale-0 group-focus-within:scale-100 transition opacity-0 group-focus-within:opacity-100"
        >
          <div class="text-xs text-neutral-400 mb-2 truncate" title={data.user.username}>
            {data.user.username}
          </div>
          <a href="/account" class="link">Settings</a>
          <a href="https://t.me/{import.meta.env.VITE_ADMIN_USERNAME || 'admin'}" target="_blank" class="link">Contact Admin</a>
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
    @apply px-3 py-2 hover:bg-neutral-800 transition-all duration-200 rounded-lg flex items-center gap-3 text-sm relative overflow-hidden;
  }
  
  .link:hover {
    transform: translateX(2px);
  }
  
  .link::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 3px;
    background: linear-gradient(to bottom, #3b82f6, #1d4ed8);
    transform: scaleY(0);
    transition: transform 0.2s ease;
    border-radius: 0 2px 2px 0;
  }
  
  .link:hover::before {
    transform: scaleY(1);
  }

  .divider {
    @apply flex items-center gap-2 py-2 px-3;
  }

  .divider > span {
    @apply text-xs text-neutral-400 uppercase font-medium tracking-wider;
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
    @apply w-4 h-4 transition-colors;
  }
  
  /* Enhance the top bar */
  .bg-neutral-800\/25 {
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(64, 64, 64, 0.3);
  }
  
  /* Icon hover effects */
  .link:hover :global(.icon) {
    transform: scale(1.1);
  }
  
  /* Mobile menu improvements */
  @media (max-width: 768px) {
    .mobile .link {
      @apply justify-center;
    }
  }
</style>
