<script lang="ts">
  import InputWithIcon from '$lib/components/InputWithIcon.svelte';
  import { User, Lock, MessageCircle } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { toast } from '@zerodevx/svelte-toast';
  import toastThemes from '$lib/toastThemes';
  import type { ActionData } from './$types';

  export let form: ActionData;
  
  let isLoading = false;
</script>

<h2 class="text-2xl font-montserrat font-semibold mb-2">Create Your Account</h2>
<p class="text-sm text-neutral-300 mb-4">Join our community today</p>

<!-- Registration Form -->
<form 
  class="space-y-2" 
  method="post" 
  action="?/register"
  use:enhance={() => {
    isLoading = true;
    return async ({ result }) => {
      isLoading = false;
      if (result.type === 'success' && result.data?.success) {
        toast.push('Account created successfully!', {
          theme: toastThemes.success,
        });
        
        // Navigate to backup page with codes and username
        const { md2faCodes, username } = result.data;
        goto(`/auth/backup?codes=${md2faCodes.join(',')}&username=${username}`);
      }
    }
  }}
>
  <input type="hidden" name="type" value="regular" />
  
  <InputWithIcon 
    icon={User} 
    placeholder="Username" 
    name="username" 
    pattern="[a-zA-Z0-9_]&#123;3,16&#125;" 
    required 
    disabled={isLoading}
  />
  {#if form?.error === 'username'}
    <span class="error">Username is invalid or already taken</span>
  {/if}

  <InputWithIcon 
    icon={Lock} 
    placeholder="Password" 
    name="password" 
    type="password" 
    minlength="6" 
    required 
    disabled={isLoading}
  />
  {#if form?.error === 'password'}
    <span class="error">Password must be at least 6 characters</span>
  {/if}

  <InputWithIcon 
    icon={Lock} 
    placeholder="Confirm Password" 
    name="confirmPassword" 
    type="password" 
    minlength="6" 
    required 
    disabled={isLoading}
  />
  {#if form?.error === 'confirmPassword'}
    <span class="error">Passwords do not match</span>
  {/if}

  <InputWithIcon 
    icon={MessageCircle} 
    placeholder="Telegram Username (Optional)" 
    name="telegramUsername" 
    type="text" 
    disabled={isLoading}
  />
  <p class="text-xs text-neutral-500">Add your @username to link your Telegram account (optional)</p>

  {#if form?.error === 'server'}
    <span class="error">Registration failed. Please try again.</span>
  {/if}

  <button type="submit" class="btn relative" disabled={isLoading}>
    {#if isLoading}
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
      </div>
      <span class="opacity-0">Create Account</span>
    {:else}
      Create Account
    {/if}
  </button>
</form>

<div class="text-center mt-4">
  <span>Already have an account?</span>
  <a href="/auth/login" class="text-blue-500 hover:text-blue-600">Sign in</a>
</div>
