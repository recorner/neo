<script lang="ts">
  import { enhance } from '$app/forms';
  import ProductInput from '../ProductInput.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<form class="card" method="post" action="?/publish" use:enhance>
  <h2 class="font-bold">Create Product</h2>
  <p class="text-sm text-neutral-400 mb-2">Create a new publicly visible product</p>
  <ProductInput categories={data.categories} />
  <button class="mt-2 btn">Publish</button>
</form>
