<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import InputWithIcon from '$lib/components/InputWithIcon.svelte';
  import PaymentModal from '$lib/components/PaymentModal.svelte';
  import toastThemes from '$lib/toastThemes';
  import { DollarSign, User } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { toast } from '@zerodevx/svelte-toast';
  import type { PageData } from './$types';

  export let data: PageData;

  let showPaymentModal = false;
  let paymentAmount = 50;

  function openCryptoPayment() {
    showPaymentModal = true;
  }

  function onPaymentConfirmed() {
    invalidateAll();
  }
</script>

<div class="grid md:grid-cols-2 gap-4">
  <div class="card h-max">
    <h2 class="font-bold">Top-Up</h2>
    <span class="text-sm mb-4 block text-neutral-300">Top up your balance with over 160 different cryptocurrencies</span>
    
    <div class="mb-4">
      <div class="input">
        <Icon src={DollarSign} class="w-5 h-5 text-neutral-400" />
        <input 
          type="number" 
          placeholder="Amount" 
          min="10" 
          bind:value={paymentAmount}
          class="w-full bg-transparent text-neutral-100 placeholder:text-neutral-400 text-sm"
        />
      </div>
    </div>
    
    <div class="space-y-2">
      <button 
        type="button" 
        on:click={openCryptoPayment}
        class="btn w-full bg-blue-600 hover:bg-blue-700"
      >
        🚀 Pay with Crypto (In-App)
      </button>
      
      <form class="w-full" method="post" action="?/topUp">
        <input type="hidden" name="amount" value={paymentAmount} />
        <button type="submit" class="btn w-full bg-gray-600 hover:bg-gray-700">
          💳 Legacy Payment (Redirect)
        </button>
      </form>
    </div>
    
    <div class="mt-4 p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
      <h4 class="font-semibold text-blue-400 mb-1">✨ New In-App Experience</h4>
      <p class="text-xs text-blue-200">
        Pay directly without leaving the site. Real-time status updates and instant balance updates.
      </p>
    </div>
    
    <div class="mt-4">
      <a 
        href="/balance/history" 
        class="block w-full text-center bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        📋 View Payment History
      </a>
    </div>
  </div>
  <form
    action="?/transfer"
    method="post"
    class="card h-max"
    use:enhance={({ formElement }) =>
      async ({ result }) => {
        if (result.type == 'success') {
          toast.push('Transfer successful', {
            theme: toastThemes.success,
          });

          formElement.reset();
          await invalidateAll();
        } else if (result.type == 'error') {
          toast.push(result.error.message, {
            theme: toastThemes.error,
          });
        } else if (result.type == 'failure') {
          const errorMessages = {
            amount: 'Insufficient funds',
            user: 'Invalid username',
          };
          toast.push(
            errorMessages[result.data.error as keyof typeof errorMessages] || 'An error occurred',
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

<!-- Payment Modal -->
<PaymentModal 
  bind:show={showPaymentModal} 
  initialAmount={paymentAmount}
  on:paymentConfirmed={onPaymentConfirmed}
  on:close={() => showPaymentModal = false}
/>
