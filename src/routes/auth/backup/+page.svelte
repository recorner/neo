<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from '@zerodevx/svelte-toast';
  import toastThemes from '$lib/toastThemes';
  import { Copy, Download, Check, Eye, EyeOff } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { goto } from '$app/navigation';

  let md2faCodes: string[] = [];
  let username = '';
  let copied = false;
  let codesVisible = false;
  let currentStep = 1;
  let isGenerating = true;

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const md2faCodesParam = urlParams.get('codes');
    const usernameParam = urlParams.get('username');
    
    if (md2faCodesParam) {
      // Add a small delay to show the generation animation
      setTimeout(() => {
        md2faCodes = md2faCodesParam.split(',').sort();
        username = usernameParam || '';
        isGenerating = false;
      }, 1500);
    } else {
      // If no codes, redirect to registration
      goto('/auth/register');
    }
  });

  const copyCodes = async () => {
    const concatenatedCodes = md2faCodes.join('\n');
    try {
      await navigator.clipboard.writeText(concatenatedCodes);
      copied = true;
      toast.push('Recovery codes copied to clipboard!', { theme: toastThemes.success });
      setTimeout(() => { copied = false; }, 2000);
    } catch (err) {
      toast.push('Failed to copy codes', { theme: toastThemes.error });
    }
  };

  const downloadCodes = () => {
    const content = `Security Recovery Codes for ${username}\n\nGenerated on: ${new Date().toLocaleString()}\n\nCodes:\n${md2faCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}\n\nIMPORTANT:\n- Store these codes securely\n- Each code can only be used once\n- You will need them to access your account`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${username}_recovery_codes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.push('Recovery codes downloaded!', { theme: toastThemes.success });
  };

  const proceedToLogin = () => {
    if (!copied && !confirm('Are you sure you have saved your recovery codes? You will not be able to see them again.')) {
      return;
    }
    goto('/auth/login');
  };
</script>

<svelte:head>
  <title>Save Your Recovery Codes</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-neutral-900 to-neutral-800">
  <div class="w-full max-w-2xl">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Account Created Successfully! 🎉</h1>
      <p class="text-neutral-400">Welcome, <span class="text-blue-400 font-semibold">{username}</span></p>
    </div>

    <div class="bg-neutral-900 rounded-xl p-8 shadow-2xl border border-neutral-800">
      {#if isGenerating}
        <!-- Generation Animation -->
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <h2 class="text-xl font-semibold text-white mb-2">Generating Security Codes</h2>
          <p class="text-neutral-400">Creating your recovery codes for account security...</p>
          <div class="mt-6 flex justify-center space-x-1">
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
          </div>
        </div>
      {:else}
        <!-- Recovery Codes Display -->
        <div class="space-y-6">
          <div class="text-center">
            <h2 class="text-2xl font-bold text-white mb-2">Save Your Recovery Codes</h2>
            <div class="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-6">
              <p class="text-yellow-300 text-sm">
                <strong>⚠️ Important:</strong> These codes can be used to access your account if you lose your password. 
                Store them securely and do not share them with anyone.
              </p>
            </div>
          </div>

          <!-- Codes Container -->
          <div class="bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden">
            <div class="p-4 border-b border-neutral-700 flex items-center justify-between">
              <h3 class="font-semibold text-white">Your Recovery Codes</h3>
              <button 
                on:click={() => codesVisible = !codesVisible}
                class="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
              >
                <Icon src={codesVisible ? EyeOff : Eye} class="w-4 h-4" />
                {codesVisible ? 'Hide' : 'Show'} Codes
              </button>
            </div>
            
            <div class="p-4 max-h-64 overflow-y-auto">
              {#if codesVisible}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {#each md2faCodes as code, index}
                    <div class="flex items-center p-3 bg-neutral-900 rounded border border-neutral-600 hover:border-neutral-500 transition-colors">
                      <span class="text-neutral-400 text-sm w-8">{index + 1}.</span>
                      <code class="font-mono text-green-400 flex-1 text-sm">{code}</code>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="text-center py-8">
                  <Icon src={EyeOff} class="w-8 h-8 text-neutral-500 mx-auto mb-2" />
                  <p class="text-neutral-500">Click "Show Codes" to reveal your recovery codes</p>
                </div>
              {/if}
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              on:click={copyCodes}
              disabled={!codesVisible}
              class="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
            >
              <Icon src={copied ? Check : Copy} class="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy Codes'}
            </button>
            
            <button
              on:click={downloadCodes}
              disabled={!codesVisible}
              class="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
            >
              <Icon src={Download} class="w-4 h-4" />
              Download Codes
            </button>
          </div>

          <!-- Security Checklist -->
          <div class="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <h4 class="font-semibold text-white mb-3">Security Checklist</h4>
            <div class="space-y-2 text-sm">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" class="rounded border-neutral-600 bg-neutral-700 text-blue-600">
                <span class="text-neutral-300">I have copied or downloaded my recovery codes</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" class="rounded border-neutral-600 bg-neutral-700 text-blue-600">
                <span class="text-neutral-300">I understand these codes are needed for account recovery</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" class="rounded border-neutral-600 bg-neutral-700 text-blue-600">
                <span class="text-neutral-300">I will store these codes in a secure location</span>
              </label>
            </div>
          </div>

          <!-- Continue Button -->
          <button
            on:click={proceedToLogin}
            class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
          >
            Continue to Login
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
