<script>
  import { Icon } from '@steeze-ui/svelte-icon';
  import { XCircle } from '@steeze-ui/feather-icons';
</script>

<div class="flex items-center justify-center flex-col pt-12">
  <Icon src={XCircle} class="w-16 h-16 text-red-500 mb-2" />
  <h1 class="font-bold">Cancelled</h1>
  <span class="text-sm mb-2 block text-neutral-300">Your payment was cancelled</span>
  <a href="/balance" class="btn w-max">Try Again</a>
</div>
