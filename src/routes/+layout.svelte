<script>
  import '../app.postcss';
  import { SvelteToast } from '@zerodevx/svelte-toast';
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;600;700&display=swap"
    rel="stylesheet"
  />
  <slot name="title">
    <title>Untouchable</title>
  </slot>
</svelte:head>

<SvelteToast />

<slot />
