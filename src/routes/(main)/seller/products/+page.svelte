<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<div class="card">
  <div class="flex justify-between items-center mb-3">
    <h2 class="font-bold">Products</h2>
    <a href="/seller/products/new" class="btn w-max">Create</a>
  </div>

  {#if data.products.length === 0}
    <p class="text-center text-xl font-semibold text-neutral-400 mx-auto">No Products</p>
  {:else}
    todo
  {/if}
</div>
