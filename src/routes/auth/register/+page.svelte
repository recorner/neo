<script lang="ts">
  import InputWithIcon from '$lib/components/InputWithIcon.svelte';
  import { User, Lock, MessageCircle } from '@steeze-ui/feather-icons';
  import type { ActionData } from './$types';

  export let form: ActionData;
</script>

<h2 class="text-2xl font-montserrat font-semibold mb-2">Create Your Account</h2>
<p class="text-sm text-neutral-300 mb-4">Join our community today</p>

<form class="space-y-2" method="post" action="?/register">
  <InputWithIcon 
    icon={User} 
    placeholder="Username" 
    name="username" 
    pattern="[a-zA-Z0-9_]&#123;3,16&#125;" 
    required 
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
  />
  {#if form?.error === 'password'}
    <span class="error">Password does not meet requirements</span>
  {/if}

  <InputWithIcon 
    icon={Lock} 
    placeholder="Confirm Password" 
    name="confirmPassword" 
    type="password" 
    minlength="6" 
    required 
  />
  {#if form?.error === 'confirmPassword'}
    <span class="error">Passwords do not match</span>
  {/if}

  <InputWithIcon 
    icon={MessageCircle} 
    placeholder="Telegram Username (Optional)" 
    name="telegramUsername" 
    type="text" 
  />

  {#if form?.error === 'server'}
    <span class="error">Registration failed. Please try again.</span>
  {/if}

  <button type="submit" class="btn">Create Account</button>

  <div class="text-center">
    <span>Already have an account?</span>
    <a href="/auth/login" class="text-blue-500 hover:text-blue-600">Sign in</a>
  </div>
</form>
