<script lang="ts">
  import InputWithIcon from '$lib/components/InputWithIcon.svelte';
  import type { PageData } from './$types';
  import { Lock } from '@steeze-ui/feather-icons';
  import { enhance } from '$app/forms';
  import { toast } from '@zerodevx/svelte-toast';
  import toastThemes, { success } from '$lib/toastThemes';
  import { hashColor } from '$lib/cUtils';

  export let data: PageData;
</script>

<div class="grid grid-cols-2 gap-4">
  <div class="h-max grid gap-4">
    <div class="card h-max">
      <h2 class="font-bold">Information</h2>
      <div class="info">
        <p>Username</p>
        <p>{data.selected.username}</p>
        <p>Balance</p>
        <p>${data.selected.balance.toFixed(2)}</p>
        <p>Registered At</p>
        <p>{new Date(data.selected.createdAt).toLocaleString('en-GB', { timeStyle: 'short', dateStyle: 'short' })}</p>
        <p>Orders</p>
        <p>{data.selected._count.orders}</p>
        <p>Top ups</p>
        <p>{data.selected._count.topUps}</p>
      </div>
    </div>
    {#if data.selected.topUps.length > 0}
      <div class="card h-max">
        <h2 class="font-bold">Last Topups</h2>
        <div class="grid grid-cols-2">
          <p class="font-bold">Amount</p>
          <p class="font-bold">Time</p>
          {#each data.selected.topUps as topUp}
            <p>${topUp.amount.toFixed(2)}</p>
            <p>{new Date(topUp.createdAt).toLocaleString('en-GB', { timeStyle: 'short', dateStyle: 'short' })}</p>
          {/each}
        </div>
      </div>
    {/if}
  </div>
  <div class="h-max grid gap-4">
    <form
      class="card h-max"
      method="post"
      action="?/updatePassword"
      use:enhance={({ form }) =>
        ({ result }) => {
          if (result.type === 'success') {
            toast.push('Password changed successfully', { theme: toastThemes.success });
            form.reset();
          } else if (result.type === 'error') {
            toast.push(result.error.message, { theme: toastThemes.error });
          } else if (result.type === 'failure') {
            toast.push('Passwords do not match', { theme: toastThemes.error });
          }
        }}
    >
      <h2 class="font-bold mb-2">Change Password</h2>
      <div class="space-y-2">
        <InputWithIcon icon={Lock} placeholder="New Password" name="password" type="password" />
        <InputWithIcon icon={Lock} placeholder="Confirm Password" name="confirm" type="password" />
        <button class="btn w-full">Change Password</button>
      </div>
    </form>
    <form
      action="?/updateRoles"
      class="card h-max"
      method="post"
      use:enhance={({ form }) =>
        ({ result }) => {
          if (result.type === 'success') {
            toast.push('Roles updated', { theme: toastThemes.success });
          } else if (result.type === 'error') {
            toast.push(result.error.message, { theme: toastThemes.error });
          }
        }}
    >
      <h2 class="font-bold mb-2">Update Roles</h2>
      <div class="flex gap-2 flex-wrap">
        {#each data.roles as role}
          <label class="role">
            <input type="checkbox" name="roles" value={role} checked={data.selected.role.includes(role)} />
            <span style={`background-color:${hashColor(role)}`}>{role}</span>
          </label>
        {/each}
        <button class="btn mt-2">Save</button>
      </div>
    </form>
  </div>
</div>

<style>
  .role > input {
    @apply hidden;
  }

  .role > span {
    @apply cursor-pointer px-2 py-1 rounded-full text-sm transition tracking-wide;
  }

  .role > input:not(:checked) + span {
    @apply grayscale transition text-neutral-300;
  }

  .info {
    @apply grid-cols-2 grid;
  }

  .info > :nth-child(even) {
    @apply text-right;
  }

  .info > :nth-child(odd) {
    @apply text-left font-semibold;
  }
</style>
