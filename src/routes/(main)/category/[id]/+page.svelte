<script lang="ts">
  import { goto } from '$app/navigation';
  import { ChevronLeft, ChevronRight } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import type { PageData } from './$types';

  export let data: PageData;

  const goToPage = (page: number) => {
    if (page < 1 || page > data.pages || page === data.page) return;
    // set the page number in the URL search params
    goto(`/category/${data.category.id}?page=${page}`);
  };
</script>

<table class="card w-full overflow-hidden">
  <thead>
    <th>Name</th>
    <th>Seller</th>
    <th>Stock</th>
    <th>Price</th>
    <th />
  </thead>
  <tbody>
    {#each data.category?.products as product}
      <tr>
        <td>{product.name}</td>
        <td>{product.seller.username}</td>
        <td>{product.stock}</td>
        <td>${product.price.toFixed(2)}</td>
        <td class="flex justify-end">
          <a href="/product/{product.id}" class="btn w-max">View</a>
        </td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="5" class="text-center">
        {#if data.category?.products.length === 0}
          No products found
        {:else}
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <p>Page</p>
              <input
                type="number"
                value={data.page}
                min={1}
                max={data.pages}
                class="bg-neutral-850 rounded-lg px-2 py-1 w-14"
                on:change={(e) => goToPage(Number(e.target.value))}
              />
              <p>of {data.pages}</p>
            </div>
            <div class="flex items-center gap-2">
              <button class="page-btn" on:click={() => goToPage(data.page - 1)}>
                <Icon src={ChevronLeft} class="w-5 h-5" />
              </button>

              <button class="page-btn" on:click={() => goToPage(data.page + 1)}>
                <Icon src={ChevronRight} class="w-5 h-5" />
              </button>
            </div>
          </div>
        {/if}
      </td>
    </tr>
  </tfoot>
</table>

<style>
  th,
  td {
    @apply text-left px-4 py-3;
  }

  th,
  tfoot > tr {
    @apply bg-neutral-800;
  }

  tr:nth-child(even) {
    @apply bg-neutral-800/25;
  }

  .page-btn {
    @apply rounded-full hover:bg-neutral-700 transition p-1;
  }
</style>
