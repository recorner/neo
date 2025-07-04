<script lang="ts">
  import InputWithIcon from '$lib/components/InputWithIcon.svelte';
  import toastThemes from '$lib/toastThemes';
  import { Bold, DollarSign, HelpCircle, Image, Italic, Type, Underline } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { toast } from '@zerodevx/svelte-toast';

  export let categories: any;
  export let product: any = null;
  let textarea: HTMLTextAreaElement;

  const wrapSelection = (textarea: HTMLTextAreaElement, prefix: string, suffix: string) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    textarea.value = text.substring(0, start) + prefix + text.substring(start, end) + suffix + text.substring(end);
    textarea.selectionStart = textarea.selectionEnd =
      end + (end == start ? prefix.length : prefix.length + suffix.length);
    textarea.focus();
  };
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
  ></textarea>
  <div>
    <div class="flex rounded-t-lg p-2 border border-neutral-700 bg-neutral-850 gap-1">
      <button class="page-btn" type="button" on:click={() => wrapSelection(textarea, '**', '**')}>
        <Icon src={Bold} class="w-5 h-5 text-neutral-400" />
      </button>
      <button class="page-btn" type="button" on:click={() => wrapSelection(textarea, '*', '*')}>
        <Icon src={Italic} class="w-5 h-5 text-neutral-400" />
      </button>
      <button class="page-btn" type="button" on:click={() => wrapSelection(textarea, '__', '__')}>
        <Icon src={Underline} class="w-5 h-5 text-neutral-400" />
      </button>
      <label class="page-btn cursor-pointer">
        <Icon src={Image} class="w-5 h-5 text-neutral-400" />
        <input
          type="file"
          name="image"
          class="hidden"
          on:change={(e) => {
            const formData = new FormData();
            formData.append('file', (e.target as HTMLInputElement).files![0]);
            fetch('/seller/products/image', {
              method: 'POST',
              body: formData,
            })
              .then((res) => res.json())
              .then((res) => {
                if (res.image) {
                  wrapSelection(textarea, `![`, `](${res.image})`);
                }

                (e.target as HTMLInputElement).value = '';
              })
              .catch((err) => {
                toast.push(err, {
                  theme: toastThemes.error,
                });
              });
          }}
        />
      </label>
    </div>
    <textarea
      bind:this={textarea}
      class="input rounded-t-none border-t-0 w-full"
      name="description"
      cols="30"
      rows="5"
      placeholder="Description"
      value={product?.description || ''}
      maxlength="4096"
    ></textarea>
  </div>
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
  <select name="type" class="input text-sm">
    <option value="0" selected={!product} disabled>Type</option>
    <option class="text-black" value="DOWNLOAD" selected={product?.type == 'DOWNLOAD'}>Download</option>
    <option class="text-black" value="LICENSE" selected={product?.type == 'LICENSE'}>License</option>
  </select>
  <textarea class="input" name="stock" cols="30" rows="5" placeholder="Stock" value={product?.stock || ''}></textarea>
</div>
