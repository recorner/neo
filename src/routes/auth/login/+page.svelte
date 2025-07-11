<script lang="ts">
  import InputWithIcon from '$lib/components/InputWithIcon.svelte';
  import Logo from '$lib/logo.svg';
  import { User, Lock, Hash } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import type { ActionData } from './$types';

  export let form: ActionData;
  
  let isLoading = false;
</script>

{#if form?.error == '2fa' || form?.error == 'code'}
  <h2 class="text-2xl font-montserrat font-semibold mb-2">Two-Factor Authentication</h2>
  <p class="text-sm text-neutral-300 mb-4">Please enter your one-time code below to continue</p>

  <form 
    class="space-y-2" 
    method="post" 
    action="?/twofactor"
    use:enhance={() => {
      isLoading = true;
      return async ({ result, update }) => {
        isLoading = false;
        if (result.type === 'redirect') {
          goto(result.location);
        } else {
          await update();
        }
      }
    }}
  >
    <InputWithIcon
      icon={Hash}
      placeholder="One-Time Code"
      name="code"
      type="text"
      minlength="6"
      maxlength="6"
      required
      disabled={isLoading}
    />
    {#if form?.error === 'code'}
      <span class="error">Invalid code</span>
    {/if}
    <button type="submit" class="btn" disabled={isLoading}>
      {#if isLoading}
        <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Continue...
      {:else}
        Continue
      {/if}
    </button>
  </form>
{:else}
  <h2 class="text-2xl font-montserrat font-semibold mb-2">Log in to Your Account</h2>
  <p class="text-sm text-neutral-300 mb-4">Welcome Back! Please enter your credentials</p>
  
  <!-- Login Form -->
  <form 
    class="space-y-2" 
    method="post" 
    action="?/login"
    use:enhance={() => {
      isLoading = true;
      return async ({ result, update }) => {
        isLoading = false;
        if (result.type === 'redirect') {
          // Handle successful login redirect
          goto(result.location);
        } else {
          // Handle errors (form validation, etc.)
          await update();
        }
      }
    }}
  >
    <InputWithIcon 
      icon={User} 
      placeholder="Username" 
      name="username" 
      pattern={'[a-zA-Z0-9_]{3,16}'} 
      required 
      disabled={isLoading}
    />
    <InputWithIcon 
      icon={Lock} 
      placeholder="Password" 
      name="password" 
      type="password" 
      minlength="6" 
      required 
      disabled={isLoading}
    />
    {#if form?.error === 'credentials'}
      <span class="error">Invalid credentials</span>
    {/if}
    <button type="submit" class="btn relative" disabled={isLoading}>
      {#if isLoading}
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        </div>
        <span class="opacity-0">Login</span>
      {:else}
        Login
      {/if}
    </button>
  </form>

  <div class="text-center mt-4">
    <span>Don't have an account?</span>
    <a href="/auth/register" class="text-blue-500 hover:text-blue-600">Register</a>
  </div>
{/if}
