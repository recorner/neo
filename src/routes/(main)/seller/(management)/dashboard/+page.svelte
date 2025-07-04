<script lang="ts">
  // TODO: Replace with Svelte 5 compatible chart library
  // import { Pie, Line } from 'svelte-chartjs';

  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    CategoryScale,
    LineElement,
    LinearScale,
    PointElement,
  } from 'chart.js';
  import { randomColor, uniqueColors } from '$lib/cUtils';
  import type { PageData } from './$types';
  import InputWithIcon from '$lib/components/InputWithIcon.svelte';
  import { DollarSign } from '@steeze-ui/feather-icons';
  import { Monero, Telegram } from '@steeze-ui/simple-icons';
  import { enhance } from '$app/forms';
  import { toast } from '@zerodevx/svelte-toast';
  import toastThemes from '$lib/toastThemes';
  import { invalidateAll } from '$app/navigation';

  ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LineElement, LinearScale, PointElement);

  export let data: PageData;
</script>

<div class="grid md:grid-cols-2 gap-4">
  <div class="card h-max">
    <h2 class="font-bold">Request a Payout</h2>
    <p class="text-neutral-300 mb-2 text-sm">Enter an XMR address below to request a payout</p>
    <form
      class="space-y-2"
      method="post"
      action="?/payout"
      use:enhance={({ formElement }) =>
        async ({ result }) => {
          if (result.type == 'success') {
            toast.push('Payout requested', {
              theme: toastThemes.success,
            });
          } else if (result.type == 'error') {
            toast.push(result.error.message, {
              theme: toastThemes.error,
            });
          } else if (result.type == 'failure') {
            const errorMessages = {
              address: 'Invalid address',
            };
            toast.push(
              errorMessages[result.data.error as keyof typeof errorMessages] || 'An error occurred',
              {
                theme: toastThemes.error,
              }
            );
          }

          await invalidateAll();
          formElement.reset();
        }}
    >
      <InputWithIcon icon={Monero} type="text" placeholder="Address" name="address" />
      <InputWithIcon
        icon={DollarSign}
        placeholder="Amount"
        type="number"
        name="amount"
        max={data.user.balance}
        step="1"
        min="10"
      />
      <button class="btn">Submit</button>
    </form>
  </div>
  <div class="card h-max">
    <h2 class="font-bold">Contact Details</h2>
    <p class="text-neutral-300 mb-2 text-sm">Enter your contact details to receive communication from customers</p>
    <form
      class="space-y-2"
      method="post"
      action="?/contact"
      use:enhance={({ formElement }) =>
        async ({ result }) => {
          if (result.type == 'success') {
            toast.push('Contact details updated', {
              theme: toastThemes.success,
            });
          } else if (result.type == 'error') {
            toast.push(result.error.message, {
              theme: toastThemes.error,
            });
          }

          formElement.reset();
        }}
    >
      <InputWithIcon icon={Telegram} placeholder="Telgram" name="telegram" />
      <button class="btn">Update</button>
    </form>
  </div>
</div>

<h2 class="my-5 text-xl font-bold">Analytics</h2>

<div class="grid md:grid-cols-2 gap-4">
  <div class="card h-max">
    <h2 class="font-bold">Top Products</h2>
    <p class="text-neutral-300 mb-2 text-sm">Your best selling products in the past 7 days</p>
    <div class="w-72 h-72 mx-auto">
      <!-- TODO: Replace with Svelte 5 compatible chart component -->
      <div class="flex items-center justify-center h-full border-2 border-dashed border-neutral-600 rounded">
        <p class="text-neutral-400">Pie Chart will be displayed here</p>
      </div>
    </div>
  </div>
  <div class="card h-max">
    <h2 class="font-bold">Sales</h2>
    <p class="text-neutral-300 mb-2 text-sm">Sales by day in the past 7 days</p>
    <!-- TODO: Replace with Svelte 5 compatible chart component -->
    <div class="flex items-center justify-center h-32 border-2 border-dashed border-neutral-600 rounded">
      <p class="text-neutral-400">Line Chart will be displayed here</p>
    </div>
  </div>
</div>
