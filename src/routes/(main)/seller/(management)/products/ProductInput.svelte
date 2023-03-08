<script lang="ts">
  import InputWithIcon from '$lib/components/InputWithIcon.svelte';
  import { DollarSign, HelpCircle, Type } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';

  export let categories: any;
  export let product: any = null;
</script>

<div class="grid gap-2">
  <div class="grid md:grid-cols-2 gap-2">
    <InputWithIcon icon={Type} placeholder="Name" name="name" value={product?.name || ''} maxlength="60" />
    <InputWithIcon
      icon={DollarSign}
      placeholder="Price"
      name="price"
      type="number"
      step="any"
      value={product?.price || ''}
    />
  </div>
  <select name="category" class="input">
    <option value="0" selected={!product?.category?.id} disabled>Category</option>
    {#each categories as category}
      <option class="text-black" value={category.id} selected={product?.category?.id == category.id}>
        {category.name}
      </option>
    {:else}
      <option class="text-black" value={0}>No categories found</option>
    {/each}
  </select>
  <textarea
    class="input"
    name="shortDesc"
    cols="30"
    rows="2"
    maxlength="100"
    placeholder="Short description"
    value={product?.shortDesc || ''}
  />
  <textarea
    class="input"
    name="description"
    cols="30"
    rows="5"
    placeholder="Description (supports markdown)"
    value={product?.description || ''}
    maxlength="4096"
  />
  <div class="flex items-center">
    <h2 class="font-bold">Stock</h2>
    <div class="group relative">
      <Icon src={HelpCircle} class="w-5 h-5 text-neutral-400 ml-1" />
      <div
        class="absolute top-0 left-0 w-[30rem] bg-neutral-800 shadow-md rounded-lg p-4 group-hover:opacity-100 opacity-0 pointer-events-none transition origin-top-left scale-0 group-hover:scale-100"
      >
        This is the product delivered to the customer, if the type is "Download" the entirety of the "Stock" input will
        be devivered to every customer. If the type is "License" the "Stock" is one license/account/deliverable per line
        and only one line will be delivered to the customer.
      </div>
    </div>
  </div>
  <select name="type" class="input text-sm" value={product?.type || 'download'}>
    <option class="text-black" value="DOWNLOAD">Download</option>
    <option class="text-black" value="LICENSE">License</option>
  </select>
  <textarea class="input" name="stock" cols="30" rows="5" placeholder="Stock" value={product?.stock || ''} />
</div>
