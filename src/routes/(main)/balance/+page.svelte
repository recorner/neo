<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import InputWithIcon from '$lib/components/InputWithIcon.svelte';
  import toastThemes from '$lib/toastThemes';
  import { DollarSign, User } from '@steeze-ui/feather-icons';
  import { toast } from '@zerodevx/svelte-toast';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<div class="grid md:grid-cols-2 gap-4">
  <form class="card h-max" method="post" action="?/topUp">
    <h2 class="font-bold">Top-Up</h2>
    <span class="text-sm mb-2 block text-neutral-300">Top up your balance with over 160 different cryptocurrencies</span
    >
    <InputWithIcon icon={DollarSign} placeholder="Amount" min="10" type="number" name="amount" value="10" />
    <button type="submit" class="btn mt-2">Proceed to Payment</button>
  </form>
  <form
    action="?/transfer"
    method="post"
    class="card h-max"
    use:enhance={({ form }) =>
      async ({ result }) => {
        if (result.type == 'success') {
          toast.push('Transfer successful', {
            theme: toastThemes.success,
          });

          form.reset();
          await invalidateAll();
        } else if (result.type == 'error') {
          toast.push(result.error.message, {
            theme: toastThemes.error,
          });
        } else if (result.type == 'failure') {
          toast.push(
            {
              amount: 'Insufficient funds',
              user: 'Invalid username',
            }[result.data.error],
            {
              theme: toastThemes.error,
            }
          );
        }
      }}
  >
    <h2 class="font-bold">Transfer</h2>
    <span class="text-sm mb-2 block text-neutral-300">Transfer funds to another user</span>
    <div class="space-y-2">
      <InputWithIcon icon={User} placeholder="Username" type="text" name="username" />
      <InputWithIcon
        icon={DollarSign}
        placeholder="Amount"
        type="number"
        name="amount"
        min={1}
        max={data.user.balance}
      />
      <button type="submit" class="btn">Transfer</button>
    </div>
  </form>
</div>
