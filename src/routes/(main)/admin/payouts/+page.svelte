<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import toastThemes from '$lib/toastThemes';
  import {
    ChevronLeft,
    ChevronRight,
    DollarSign,
    Clipboard,
    Clock,
    CheckCircle,
    XCircle,
  } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { toast } from '@zerodevx/svelte-toast';
  import type { PageData } from './$types';

  export let data: PageData;

  const goToPage = (page: number) => {
    if (page < 1 || page > data.pages || page === data.page) return;
    // set the page number in the URL search params
    goto(`/admin/payouts?page=${page}`);
  };

  const truncateMiddle = (str: string, length: number) => {
    if (str.length <= length) return str;
    const half = Math.floor(length / 2);
    return `${str.slice(0, half)}...${str.slice(str.length - half)}`;
  };
</script>

{#if data.payouts.length === 0}
  <div class="flex items-center justify-center flex-col pt-12">
    <Icon src={DollarSign} class="w-16 h-16 text-neutral-500 mb-2" />
    <h1 class="font-bold">No Payouts Requested</h1>
    <span class="text-sm mb-2 block text-neutral-300">Nobody has requested a payout yet</span>
  </div>
{:else}
  <table class="card w-full overflow-hidden">
    <thead>
      <th>Username</th>
      <th>Timestamp</th>
      <th>Address</th>
      <th>Amount</th>
      <th>Status</th>
      <th />
    </thead>
    <tbody>
      {#each data.payouts as payout}
        <tr>
          <td>{payout.user.username}</td>
          <td>{new Date(payout.createdAt).toLocaleString('en-GB', { timeStyle: 'short', dateStyle: 'short' })}</td>
          <td>
            <button
              class="flex items-center gap-2 hover:text-blue-400 transition"
              on:click={() => {
                navigator.clipboard.writeText(payout.address);
                toast.push('Copied to clipboard', { theme: toastThemes.success });
              }}
            >
              <span>{truncateMiddle(payout.address, 12)}</span>
              <Icon src={Clipboard} class="w-4 h-4" />
            </button>
          </td>
          <td>${payout.amount.toFixed(2)}</td>
          <td>
            {#if payout.status == 'PENDING'}
              <Icon src={Clock} class="w-5 h-5 text-neutral-500" />
            {:else if payout.status == 'COMPLETED'}
              <Icon src={CheckCircle} class="w-5 h-5 text-green-500" />
            {:else if payout.status == 'REJECTED'}
              <Icon src={XCircle} class="w-5 h-5 text-red-500" />
            {/if}
          </td>
          <td class="flex justify-end">
            {#if payout.status == 'PENDING'}
              <form
                action="?/approve"
                method="post"
                use:enhance={() =>
                  async ({ result }) => {
                    if (result.type == 'success') {
                      toast.push('Payout marked as paid', { theme: toastThemes.success });
                    }
                    await invalidateAll();
                  }}
              >
                <input type="hidden" name="id" value={payout.id} />
                <button class="btn w-max">Mark as Paid</button>
              </form>
            {/if}
          </td>
        </tr>
      {/each}
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
