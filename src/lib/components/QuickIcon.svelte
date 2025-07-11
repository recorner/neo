<script lang="ts">
  import { onMount } from 'svelte';
  import IconifyIcon from '@iconify/svelte';

  export let icon: string;
  export let fallback: string = '●'; // Simple fallback character
  export let className: string = 'w-4 h-4';

  let iconLoaded = false;
  let showFallback = true;

  // Simple icon fallbacks for common icons
  const fallbackMap: Record<string, string> = {
    'material-symbols:home': '🏠',
    'material-symbols:package-2': '📦',
    'material-symbols:shopping-cart': '🛒',
    'material-symbols:credit-card': '💳',
    'material-symbols:dashboard': '📊',
    'material-symbols:inventory-2': '📋',
    'material-symbols:upload': '⬆️',
    'material-symbols:group': '👥',
    'material-symbols:payments': '💰',
    'material-symbols:settings': '⚙️',
    'material-symbols:account-circle': '👤',
    'material-symbols:account-balance-wallet': '💳',
    'material-symbols:menu': '☰',
    'material-symbols:schedule': '🕐',
    'ic:baseline-telegram': '📱'
  };

  const iconFallback = fallbackMap[icon] || fallback;

  onMount(() => {
    // Hide fallback after a short delay to allow icon to load
    const timer = setTimeout(() => {
      iconLoaded = true;
      showFallback = false;
    }, 200);

    return () => clearTimeout(timer);
  });
</script>

<div class="relative inline-flex items-center justify-center {className}">
  {#if showFallback}
    <span class="text-sm select-none transition-opacity duration-200" style="opacity: {iconLoaded ? 0 : 1}">
      {iconFallback}
    </span>
  {/if}
  
  <div class="absolute inset-0 transition-opacity duration-200" style="opacity: {iconLoaded ? 1 : 0}">
    <IconifyIcon {icon} class={className} />
  </div>
</div>
