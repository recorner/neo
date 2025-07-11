<script lang="ts">
  import IconifyIcon from '@iconify/svelte';
  import { onMount } from 'svelte';

  export let icon: string;
  export let fallback: string = '•';
  export let className: string = '';
  
  let mounted = false;
  let iconLoaded = false;
  
  onMount(() => {
    mounted = true;
    // Preload the icon
    setTimeout(() => {
      iconLoaded = true;
    }, 100);
  });
</script>

{#if mounted && iconLoaded}
  <IconifyIcon {icon} class={className} />
{:else}
  <span class={className} style="display: inline-block; text-align: center; line-height: 1;">
    {fallback}
  </span>
{/if}
