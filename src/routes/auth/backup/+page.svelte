<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from '@zerodevx/svelte-toast';

  let md2faCodes: string[] = [];

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const md2faCodesParam = urlParams.get('codes'); // Updated to look for 'codes' parameter
    if (md2faCodesParam) {
      md2faCodes = md2faCodesParam.split(',').sort(); // Sort the codes before assigning
    }
  });

  const copyCodes = () => {
    const concatenatedCodes = md2faCodes.join('\n'); // Join codes with newline for better formatting
    navigator.clipboard.writeText(concatenatedCodes);
    toast.push('Codes copied to clipboard! Remember the order.', { theme: 'success' });
  };
</script>

<div class="unique-message">
  <h2 class="unique-text-2xl unique-font-montserrat unique-font-semibold mb-2">Confirmation Page</h2>
  <p class="unique-text-sm unique-text-neutral-300 mb-4">
    Save the following MD2FA codes securely. You will need them for login.
  </p>
</div>

<div class="unique-code-container">
  <div class="unique-code-box">
    {#each md2faCodes as code, index (code)}
      <div class="unique-code-line">
        <span class="unique-code-index">{index + 1}:</span>
        <span class="unique-code">{code}</span>
      </div>
    {/each}
  </div>
</div>

<button on:click={copyCodes} class="unique-btn">Copy Codes</button>
<a href="/auth/login" class="unique-btn unique-login-btn">Codes Saved. Go to Login</a>

<style>
  /* Styles for unique-message and unique-login-btn are not provided here to avoid redundancy */
  
  .unique-code-container {
    background-color: #333; /* Dark background color */
    border: 1px solid #555;
    padding: 10px;
    border-radius: 4px;
    overflow: auto;
    max-height: 200px;
    margin-bottom: 10px;
  }

  .unique-code-box {
    display: flex;
    flex-direction: column;
    align-items: flex-start; /* Align codes to the start (left) of the container */
  }

  .unique-code-line {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  .unique-code-index {
    color: #777;
    margin-right: 10px;
  }

  .unique-code {
    font-family: 'Courier New', monospace;
    color: #fff;
  }

  .unique-btn {
    background-color: #007bff;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
    margin-right: 10px;
  }

  .unique-btn:hover {
    background-color: #0056b3;
  }

  .unique-login-btn {
    background-color: #28a745;
  }

  .unique-login-btn:hover {
    background-color: #218838;
  }
</style>
