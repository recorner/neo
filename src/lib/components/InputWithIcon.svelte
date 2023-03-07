<script lang="ts">
  import { Icon } from '@steeze-ui/svelte-icon';
  import type { IconSource } from '@steeze-ui/svelte-icon/types';
  import classnames from 'classnames';

  export let icon: IconSource;
</script>

<div
  class="flex gap-2 items-center bg-neutral-800 border border-neutral-700 px-3 py-2 rounded-lg focus-within:border-neutral-600 transition"
>
  {#if icon}
    <Icon src={icon} class="w-5 h-5 text-neutral-400" />
  {/if}
  <input
    {...$$props}
    class={classnames('w-full bg-transparent text-neutral-100 placeholder:text-neutral-400 text-sm', $$props.class)}
  />
</div>
