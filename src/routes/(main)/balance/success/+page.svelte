<script>
  import { Icon } from '@steeze-ui/svelte-icon';
  import { CheckCircle } from '@steeze-ui/feather-icons';
</script>

<div class="flex items-center justify-center flex-col pt-12">
  <Icon src={CheckCircle} class="w-16 h-16 text-green-500 mb-2" />
  <h1 class="font-bold">Success!</h1>
  <span class="text-sm mb-2 block text-neutral-300">Your balance has been topped up</span>
</div>
