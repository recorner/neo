<script lang="ts">
  import { enhance } from '$app/forms';
  import InputWithIcon from '$lib/components/InputWithIcon.svelte';
  import { DollarSign, HelpCircle, Type } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<form class="card" method="post" action="?/publish" use:enhance>
  <h2 class="font-bold">Create Product</h2>
  <p class="text-sm text-neutral-400 mb-2">Create a new publicly visible product</p>
  <div class="grid gap-2">
    <div class="grid md:grid-cols-2 gap-2">
      <InputWithIcon icon={Type} placeholder="Name" name="name" />
      <InputWithIcon icon={DollarSign} placeholder="Price" name="price" type="number" step="any" />
    </div>
    <select name="category" class="input">
      <option value="0" disabled selected>Category</option>
      {#each data.categories as category}
        <option class="text-black" value={category.id}>{category.name}</option>
      {/each}
    </select>
    <textarea class="input" name="description" cols="30" rows="5" placeholder="Description (supports markdown)" />
    <div class="flex items-center">
      <h2 class="font-bold">Stock</h2>
      <div class="group relative">
        <Icon src={HelpCircle} class="w-5 h-5 text-neutral-400 ml-1" />
        <div
          class="absolute top-0 left-0 w-72 bg-neutral-800 shadow-md rounded-lg p-4 group-hover:opacity-100 opacity-0 pointer-events-none transition origin-top-left scale-0 group-hover:scale-100"
        >
          This is the product delivered to the customer, if the type is "Download" the entirety of the "Stock" input
          will be devivered to every customer. If the type is "License" the "Stock" is one license/account/deliverable
          per line and only one line will be delivered to the customer.
        </div>
      </div>
    </div>
    <select name="type" class="input text-sm">
      <option class="text-black" value="download">Download</option>
      <option class="text-black" value="license">License</option>
    </select>
    <textarea class="input" name="stock" cols="30" rows="5" placeholder="Stock" />
  </div>
  <button class="mt-2 btn">Publish</button>
</form>
