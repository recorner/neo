<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { Minus, Plus } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { toast } from '@zerodevx/svelte-toast';
  import { marked, Renderer } from 'marked';
  import type { PageData } from './$types';
  import toastThemes from '$lib/toastThemes';
  import { invalidate, invalidateAll } from '$app/navigation';

  export let data: PageData;
  let quantity = 1;

  marked.use({
    renderer: {
      // image(string href, string title, string text)
      image: (href, title, text) => {
        if (!href) return '';

        if (!href.includes('://') || new URL(href).origin === 'http://localhost:9000') {
          return `<img src="${href}" alt="${text || ''}" title="${title || ''}" />`;
        }
      },
    },
  });
</script>

<div class="flex gap-4 flex-col-reverse md:flex-row">
  <div class="card w-full h-max">
    <h2 class="font-semibold text-2xl">{data.product.name}</h2>
    <p class="text-neutral-300 mb-3">
      Sold by
      <a href="/seller/{data.product.seller.id}" class="hover:underline text-white">{data.product.seller.username}</a>
    </p>
    <div class="prose prose-invert">
      {@html marked.parse(data.product.description, {})}
    </div>
  </div>
  <form
    class="card md:w-80 lg:w-[30rem] h-max sticky top-4"
    method="post"
    action="?/add"
    use:enhance={() =>
      async ({ result }) => {
        console.log(result);
        if (result.type === 'success') {
          await applyAction(result);
          await invalidateAll();
          toast.push('Added to cart', {
            theme: toastThemes.success,
          });
        } else if (result.type === 'failure') {
          toast.push(
            {
              quantity: 'Bad Quantity',
              full: 'You already have the maximum amount of this product in your cart',
            }[result.data.error],
            {
              theme: toastThemes.error,
            }
          );
        } else if (result.type === 'error') {
          toast.push(result.error.message, {
            theme: toastThemes.error,
          });
        }
      }}
  >
    {#if typeof data.product.stock == 'number' && data.product.stock <= 0}
      <h3 class="font-semibold text-center">Out of Stock</h3>
    {:else}
      <h3 class="font-semibold">Purchase</h3>
      <div class="flex flex-col gap-2">
        <div class="my-6 text-xl font-bold text-center">
          ${(data.product.price * quantity).toFixed(2)}
        </div>
        {#if data.product.stock == '∞' || data.product.stock > 0}
          {@const max = data.product.stock == '∞' ? 1 : data.product.stock}
          {@const updateQuantity = (value) => {
            if (value < 1) quantity = 1;
            else if (value > max) quantity = max;
            else quantity = value;
          }}
          {#if max > 1}
            <div class="flex items-center gap-2 rounded-lg bg-neutral-800 px-3 py-2 border border-neutral-700">
              <button class="page-btn" on:click={() => updateQuantity(quantity - 1)} type="button">
                <Icon src={Minus} class="w-5 h-5" />
              </button>

              <input
                type="number"
                name="quantity"
                class="bg-transparent text-center w-full"
                bind:value={quantity}
                {max}
                min={1}
              />

              <button class="page-btn" on:click={() => updateQuantity(quantity + 1)} type="button">
                <Icon src={Plus} class="w-5 h-5" />
              </button>
            </div>
          {:else}
            <input type="hidden" name="quantity" value={1} />
          {/if}
        {/if}
        <button class="btn w-full">Add to cart</button>
        <!-- <button class="btn w-full gray">Buy Now</button> -->
      </div>
    {/if}
  </form>
</div>
