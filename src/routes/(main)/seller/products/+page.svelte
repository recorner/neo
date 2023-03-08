<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<div class="flex justify-between items-center mb-4">
  <h2 class="font-bold text-xl">Products</h2>
  <a href="/seller/products/new" class="btn w-max">Create</a>
</div>

{#if data.products.length === 0}
  <p class="text-center text-xl font-semibold text-neutral-400 mx-auto">No Products</p>
{:else}
  <table class="card w-full overflow-hidden">
    <thead>
      <tr>
        <th>Name</th>
        <th>Category</th>
        <th>Price</th>
        <th>Stock</th>
        <th />
      </tr>
    </thead>
    <tbody>
      {#each data.products as product}
        <tr>
          <td>{product.name}</td>
          <td>{product.category.name}</td>
          <td>${product.price.toFixed(2)}</td>
          <td>{product.stock}</td>
          <td class="flex justify-end">
            <a href="/seller/products/{product.id}" class="btn w-max">Edit</a>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
