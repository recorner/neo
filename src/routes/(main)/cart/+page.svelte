<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import toastThemes from '$lib/toastThemes';
  import { AlertTriangle, Trash } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { toast } from '@zerodevx/svelte-toast';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<form class="flex gap-4 flex-col md:flex-row" method="post" action="?/checkout">
  <div class="card w-full h-max">
    <h2 class="font-bold">Cart</h2>
    <p class="text-sm text-neutral-400 mb-2">Review your cart before checking out</p>

    <div class="grid gap-2">
      {#each data.products as item}
        <input type="hidden" name="products" value={item.id} />
        <input type="hidden" name="quantities" value={item.quantity} />

        <div class="flex justify-between items-center">
          <div class="flex gap-3">
            <div>
              <p>{item.name}</p>
              <p class="text-sm text-neutral-300">{item.category.name}</p>
            </div>
          </div>
          <div class="flex gap-3 items-center">
            <input
              type="number"
              bind:value={item.quantity}
              min={1}
              max={typeof item.stock === 'number' ? item.stock : 999}
              class="bg-neutral-850 rounded-lg px-2 py-1 w-16 border border-neutral-700"
            />
            <p>&times;</p>
            <p class="font-bold">${item.price.toFixed(2)}</p>
            <button
              class="hover:text-red-500 transition"
              type="button"
              on:click={() => {
                data.products = data.products.filter((i) => i.id !== item.id);
              }}
            >
              <Icon src={Trash} class="w-5 h-5" />
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="card md:w-80 lg:w-[30rem] h-max sticky top-4">
    <h2 class="font-bold">Checkout</h2>
    <div class="my-6 text-xl font-bold text-center">
      ${data.products.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}
    </div>
    <button class="btn">Checkout</button>
  </div>
</form>
