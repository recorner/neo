<script lang="ts">
  import { goto } from '$app/navigation';
  import { ChevronLeft, ChevronRight, Frown } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import type { PageData } from './$types';

  export let data: PageData;

  const goToPage = (page: number) => {
    if (page < 1 || page > data.pages || page === data.page) return;
    // set the page number in the URL search params
    goto(`/category/${data.category.id}?page=${page}`);
  };
</script>

{#if data.category?.products?.length === 0}
  <div class="flex items-center justify-center flex-col pt-12">
    <Icon src={Frown} class="w-16 h-16 text-neutral-500 mb-2" />
    <h1 class="font-bold">No Products</h1>
    <span class="text-sm mb-2 block text-neutral-300">There are no products here, check back later</span>
  </div>
{:else}
  <table class="card w-full overflow-hidden">
    <thead>
      <th>Name</th>
      <th>Seller</th>
      <th>Description</th>
      <th>Stock</th>
      <th>Price</th>
      <th />
    </thead>
    <tbody>
      {#if data.category.products}
        {#each data.category.products as product}
          <tr>
            <td>{product.name}</td>
            <td>
              <a href={`/seller/${product.seller.id}`} class="hover:underline">
                {product.seller.username}
              </a>
            </td>
            <td>{product.shortDesc}</td>
            <td>{product.stock}</td>
            <td>${product.price.toFixed(2)}</td>
            <td class="flex justify-end">
              <a href="/product/{product.id}" class="btn w-max">View</a>
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="6" class="text-center">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <p>Page</p>
              <input
                type="number"
                value={data.page}
                min={1}
                max={data.pages}
                class="bg-neutral-850 rounded-lg px-2 py-1 w-14 border border-neutral-700"
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
        </td>
      </tr>
    </tfoot>
  </table>
{/if}
