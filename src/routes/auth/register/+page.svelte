<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import InputWithIcon from '$lib/components/InputWithIcon.svelte';
  import { User, Lock, MessageCircle } from '@steeze-ui/feather-icons';
  import { toast } from '@zerodevx/svelte-toast';
  import toastThemes, { success } from '$lib/toastThemes';
  import type { ActionData } from './$types';

  export let form: ActionData;
</script>

<h2 class="text-2xl font-montserrat font-semibold mb-2">Create a New Account</h2>
<p class="text-sm text-neutral-300 mb-4">Let's Get Started! Fill Out the Form Below to Register</p>
<form
  class="space-y-2"
  method="post"
  action="?/register"
  use:enhance={() =>
    async ({ result }) => {
      if (result.type === 'success') toast.push('Registration successful!', { theme: toastThemes.success });
      await applyAction(result);
    }}
>
  <InputWithIcon icon={User} placeholder="Username" name="username" pattern={'[a-zA-Z0-9_]{3,16}'} required />
  {#if form?.error === 'username'}
    <span class="error">Username is invalid or already in-use</span>
  {/if}
  <InputWithIcon icon={Lock} placeholder="Password" name="password" type="password" minlength="8" required />
  {#if form?.error === 'password'}
    <span class="error">Password is invalid</span>
  {/if}
  <InputWithIcon
    icon={Lock}
    placeholder="Confirm Password"
    name="confirmPassword"
    type="password"
    minlength="8"
    required
  />
  {#if form?.error === 'confirmPassword'}
    <span class="error">Passwords do not match</span>
  {/if}
  <InputWithIcon icon={MessageCircle} placeholder="Telegram Username" name="telegramUsername" type="text" />
  <button type="submit" class="btn"> Register </button>
  <div class="text-center">
    <span>Already have an account?</span>
    <a href="/auth/login" class="text-blue-500 hover:text-blue-600 transition">Login</a>
  </div>
</form>