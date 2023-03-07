<script lang="ts">
  import CaptchaInput from '$lib/components/CaptchaInput.svelte';
  import InputWithIcon from '$lib/components/InputWithIcon.svelte';
  import Logo from '$lib/logo.svg';
  import { User, Lock } from '@steeze-ui/feather-icons';
  import type { ActionData } from './$types';

  export let form: ActionData;
</script>

<h2 class="text-2xl font-montserrat font-semibold mb-2">Log in to Your Account</h2>
<p class="text-sm text-neutral-300 mb-4">Welcome Back! Enter Your Credentials to Continue</p>
<form class="space-y-2" method="post" action="?/login">
  <InputWithIcon icon={User} placeholder="Username" name="username" pattern={'[a-zA-Z0-9_]{3,16}'} required />
  <InputWithIcon icon={Lock} placeholder="Password" name="password" type="password" minlength="8" required />
  {#if form?.error === 'credentials'}
    <span class="error">Invalid credentials</span>
  {/if}
  <CaptchaInput />
  {#if form?.error === 'captcha'}
    <span class="error">Invalid captcha</span>
  {/if}
  <button
    type="submit"
    class="block w-full px-3 py-2 bg-blue-500 rounded-lg text-sm hover:bg-blue-600 transition focus:ring-2 ring-blue-500/50"
  >
    Login
  </button>
  <div class="text-center">
    <span>Don't have an account?</span>
    <a href="/auth/register" class="text-blue-500 hover:text-blue-600">Register</a>
  </div>
</form>
