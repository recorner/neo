<script lang="ts">
  import InputWithIcon from '$lib/components/InputWithIcon.svelte';
  import Logo from '$lib/logo.svg';
  import { User, Lock, Hash } from '@steeze-ui/feather-icons';
  import type { ActionData } from './$types';

  export let form: ActionData;
</script>

{#if form?.error == '2fa' || form?.error == 'code'}
  <h2 class="text-2xl font-montserrat font-semibold mb-2">Two-Factor Authentication</h2>
  <p class="text-sm text-neutral-300 mb-4">Please enter your one-time code below to continue</p>

  <form class="space-y-2" method="post" action="?/twofactor">
    <InputWithIcon
      icon={Hash}
      placeholder="One-Time Code"
      name="code"
      type="text"
      minlength="6"
      maxlength="6"
      required
    />
    {#if form?.error === 'code'}
      <span class="error">Invalid code</span>
    {/if}
    <button type="submit" class="btn"> Continue </button>
  </form>
{:else}
  <h2 class="text-2xl font-montserrat font-semibold mb-2">Log in to Your Account</h2>
  <p class="text-sm text-neutral-300 mb-4">Welcome Back! Enter Your Credentials to Continue</p>
  <form class="space-y-2" method="post" action="?/login">
    <InputWithIcon icon={User} placeholder="Username" name="username" pattern={'[a-zA-Z0-9_]{3,16}'} required />
    <InputWithIcon icon={Lock} placeholder="Password" name="password" type="password" minlength="8" required />
    {#if form?.error === 'credentials'}
      <span class="error">Invalid credentials</span>
    {/if}
    <button type="submit" class="btn"> Login </button>
    <div class="text-center">
      <span>Don't have an account?</span>
      <a href="/auth/register" class="text-blue-500 hover:text-blue-600">Register</a>
    </div>
  </form>
{/if}
