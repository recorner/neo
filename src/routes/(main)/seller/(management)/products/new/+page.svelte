<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import toastThemes from '$lib/toastThemes';
  import { toast } from '@zerodevx/svelte-toast';
  import ProductInput from '../ProductInput.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<form
  class="card"
  method="post"
  action="?/publish"
  use:enhance={() =>
    async ({ result }) => {
      if (result.type === 'success') {
        toast.push('Product created', {
          theme: toastThemes.success,
        });
      } else if (result.type === 'failure') {
        toast.push(result.data.error, {
          theme: toastThemes.error,
        });
      } else if (result.type === 'error') {
        toast.push(result.error.message, {
          theme: toastThemes.error,
        });
      }

      await applyAction(result);
    }}
>
  <h2 class="font-bold">Create Product</h2>
  <p class="text-sm text-neutral-400 mb-2">Create a new publicly visible product</p>
  <ProductInput categories={data.categories} />
  <button class="mt-2 btn">Publish</button>
</form>
