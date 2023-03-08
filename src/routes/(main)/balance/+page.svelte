<script>
  import InputWithIcon from '$lib/components/InputWithIcon.svelte';
  import { DollarSign } from '@steeze-ui/feather-icons';
</script>

<form class="card w-1/2" method="post" action="?/topUp">
  <h1 class="font-bold">Top-Up</h1>
  <span class="text-sm mb-2 block text-neutral-300">Top up your balance with over 160 different cryptocurrencies</span>
  <InputWithIcon icon={DollarSign} placeholder="Amount" min="10" type="number" name="amount" value="10" />
  <button type="submit" class="btn mt-2">Proceed to Payment</button>
</form>
