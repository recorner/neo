<script lang="ts">
  import { Box, DollarSign } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<h2 class="text-xl font-bold mb-4">Welcome back, {data.user.username}!</h2>
<div class="grid grid-cols-4 gap-4">
  <div class="card relative overflow-hidden">
    <Icon src={Box} class="w-32 h-32 text-neutral-600 absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3" />
    <h3>Orders</h3>
    <p class="text-2xl font-bold">{data.orders}</p>
  </div>
  <div class="card relative overflow-hidden">
    <Icon
      src={DollarSign}
      class="w-32 h-32 text-neutral-600 absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3"
    />
    <h3>Balance</h3>
    <p class="text-2xl font-bold">${data.user.balance.toFixed(2)}</p>
  </div>
</div>
<h2 class="text-xl font-bold my-4">News</h2>

<div class="grid gap-4">
  {#each data.announcements as announcement}
    <div class="card">
      <h3 class="text-lg font-semibold">{announcement.title}</h3>
      <p>{announcement.body}</p>
      <span class="block text-xs mt-1 text-neutral-300"
        >Posted by {announcement.poster.username} at {new Date(announcement.createdAt).toLocaleString('en-GB', {
          dateStyle: 'short',
          timeStyle: 'short',
        })}</span
      >
    </div>
  {:else}
    <p class="text-neutral-300">No announcements yet</p>
  {/each}
</div>
