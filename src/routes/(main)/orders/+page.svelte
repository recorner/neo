<script lang="ts">
  import { Box } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<div class="grid gap-4">
  {#each data.orders.sort((a, b) => b.id - a.id) as order}
    <div class="card">
      <div class="flex justify-between">
        <h2 class="font-bold">Order #{order.id}</h2>
        <p class="font-semibold">
          {new Date(order.createdAt).toLocaleString('en-GB', { timeStyle: 'short', dateStyle: 'short' })}
        </p>
      </div>
      {#each order.cart as entry}
        <div class="mt-3">
          <div class="flex justify-between mb-1">
            <p class="font-semibold">{entry.quantity}x {entry.product.name}</p>
            <p class="">
              Sold by <a class="hover:underline" href={`/seller/${entry.product.seller.id}`}
                >{entry.product.seller.username}</a
              >
            </p>
          </div>
          <pre class="rounded-lg bg-neutral-800 p-4">{entry.delivered}</pre>
        </div>
      {/each}
    </div>
  {:else}
    <div class="flex items-center justify-center flex-col pt-12">
      <Icon src={Box} class="w-16 h-16 text-neutral-500 mb-2" />
      <h1 class="font-bold">No Orders</h1>
      <span class="text-sm mb-2 block text-neutral-300">You haven't placed any orders yet</span>
    </div>
  {/each}
</div>
