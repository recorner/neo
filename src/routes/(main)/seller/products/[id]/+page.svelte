<script lang="ts">
  import { enhance } from '$app/forms';
  import toastThemes from '$lib/toastThemes';
  import { toast } from '@zerodevx/svelte-toast';
  import ProductInput from '../ProductInput.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<form
  class="card"
  method="post"
  action="?/update"
  use:enhance={() =>
    async ({ result }) => {
      if (result.type === 'success') {
        toast.push('Product updated', {
          theme: toastThemes.success,
        });
      } else if (result.type === 'error') {
        toast.push(result.error.message, {
          theme: toastThemes.error,
        });
      }
    }}
>
  <h2 class="font-bold">Edit Product</h2>
  <p class="text-sm text-neutral-400 mb-2">Edit your already existing product</p>
  <ProductInput categories={data.categories} product={data.product} />
  <button class="mt-2 btn">Save</button>
</form>
