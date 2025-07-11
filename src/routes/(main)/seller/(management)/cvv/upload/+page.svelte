<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  
  export let data: PageData;

  let uploadMethod: 'file' | 'paste' = 'file';
  let fileInput: HTMLInputElement;
  let pasteContent = '';
  let splitter = '|';
  let selectedFile: File | null = null;
  let isUploading = false;
  let uploadProgress = '';
  
  // Field mapping dropdowns
  let fieldMappings: Record<string, number> = {
    cardNumber: -1,
    expMonth: -1,
    expYear: -1,
    cvv: -1,
    fullName: -1,
    firstName: -1,
    lastName: -1,
    address: -1,
    city: -1,
    state: -1,
    zip: -1,
    country: -1,
    phone: -1,
    email: -1,
    ssn: -1,
    dob: -1,
    mmn: -1,
    dl: -1,
    sortCode: -1,
    atmPin: -1,
    carrierPin: -1,
    cardBalance: -1,
    userAgent: -1,
    ip: -1
  };

  let previewData: string[][] = [];
  let previewHeaders: string[] = [];
  let showPreview = false;
  
  // Check if user has seller role
  $: canUpload = data.user?.role?.includes('SELLER') || data.user?.role?.includes('ADMIN');

  if (!canUpload) {
    goto('/');
  }

  function handleFileSelect() {
    const file = fileInput.files?.[0];
    if (!file) return;
    
    selectedFile = file;
    parseFile(file);
  }

  function parseFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      parseContent(content);
    };
    reader.readAsText(file);
  }

  function parseContent(content: string) {
    const lines = content.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return;

    // Parse first few lines for preview
    previewData = lines.slice(0, 10).map(line => line.split(splitter));
    previewHeaders = previewData[0]?.map((_, index) => `Column ${index + 1}`) || [];
    showPreview = true;
    
    // Reset field mappings
    Object.keys(fieldMappings).forEach(key => {
      fieldMappings[key] = -1;
    });
  }

  function handlePasteContent() {
    if (!pasteContent.trim()) return;
    parseContent(pasteContent);
  }

  function autoMapFields() {
    // Auto-map common field patterns
    previewHeaders.forEach((header, index) => {
      const lowerHeader = header.toLowerCase();
      
      if (lowerHeader.includes('card') || lowerHeader.includes('number') || lowerHeader.includes('cc')) {
        fieldMappings.cardNumber = index;
      } else if (lowerHeader.includes('exp') && (lowerHeader.includes('month') || lowerHeader.includes('mm'))) {
        fieldMappings.expMonth = index;
      } else if (lowerHeader.includes('exp') && (lowerHeader.includes('year') || lowerHeader.includes('yy'))) {
        fieldMappings.expYear = index;
      } else if (lowerHeader.includes('cvv') || lowerHeader.includes('cvc') || lowerHeader.includes('security')) {
        fieldMappings.cvv = index;
      } else if (lowerHeader.includes('name') && !lowerHeader.includes('first') && !lowerHeader.includes('last')) {
        fieldMappings.fullName = index;
      } else if (lowerHeader.includes('first') && lowerHeader.includes('name')) {
        fieldMappings.firstName = index;
      } else if (lowerHeader.includes('last') && lowerHeader.includes('name')) {
        fieldMappings.lastName = index;
      } else if (lowerHeader.includes('address') || lowerHeader.includes('street')) {
        fieldMappings.address = index;
      } else if (lowerHeader.includes('city')) {
        fieldMappings.city = index;
      } else if (lowerHeader.includes('state') || lowerHeader.includes('province')) {
        fieldMappings.state = index;
      } else if (lowerHeader.includes('zip') || lowerHeader.includes('postal')) {
        fieldMappings.zip = index;
      } else if (lowerHeader.includes('country')) {
        fieldMappings.country = index;
      } else if (lowerHeader.includes('phone')) {
        fieldMappings.phone = index;
      } else if (lowerHeader.includes('email')) {
        fieldMappings.email = index;
      }
    });
  }

  async function uploadCards() {
    if (!showPreview || (!selectedFile && !pasteContent.trim())) {
      alert('Please select a file or paste content first');
      return;
    }

    // Validate required fields
    if (fieldMappings.cardNumber === -1 || fieldMappings.expMonth === -1 || 
        fieldMappings.expYear === -1 || fieldMappings.cvv === -1) {
      alert('Please map at least Card Number, Exp Month, Exp Year, and CVV fields');
      return;
    }

    isUploading = true;
    uploadProgress = 'Preparing upload...';

    try {
      const content = selectedFile ? await selectedFile.text() : pasteContent;
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      uploadProgress = `Processing ${lines.length} cards...`;

      const response = await fetch('/seller/cvv/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: lines,
          splitter: splitter,
          fieldMappings: fieldMappings
        })
      });

      const result = await response.json();

      if (response.ok) {
        uploadProgress = `Successfully uploaded ${result.uploaded} cards!`;
        setTimeout(() => {
          goto('/seller/cvv');
        }, 2000);
      } else {
        uploadProgress = `Error: ${result.error}`;
        isUploading = false;
      }
    } catch (error) {
      console.error('Upload error:', error);
      uploadProgress = 'Upload failed. Please try again.';
      isUploading = false;
    }
  }

  // Watch for splitter changes to re-parse content
  $: if (splitter && (selectedFile || pasteContent)) {
    if (selectedFile) {
      parseFile(selectedFile);
    } else if (pasteContent) {
      parseContent(pasteContent);
    }
  }
</script>

<svelte:head>
  <title>Upload CVV Cards - Seller Management</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold">Upload CVV Cards</h1>
      <p class="text-neutral-400 mt-1">
        Upload credit card data to your inventory for sale
      </p>
    </div>
    
    <div class="flex gap-2">
      <a href="/seller/cvv" class="btn btn-secondary">
        ← Back to CVV Management
      </a>
      <a href="/seller/cvv/dashboard" class="btn btn-secondary">
        📊 Dashboard
      </a>
    </div>
  </div>

  <!-- Upload Method Selection -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-semibold">Upload Method</h2>
    </div>
    <div class="card-body">
      <div class="flex gap-4 mb-4">
        <label class="flex items-center gap-2">
          <input
            type="radio"
            bind:group={uploadMethod}
            value="file"
            class="radio"
          />
          <span>Upload File</span>
        </label>
        <label class="flex items-center gap-2">
          <input
            type="radio"
            bind:group={uploadMethod}
            value="paste"
            class="radio"
          />
          <span>Paste Content</span>
        </label>
      </div>

      {#if uploadMethod === 'file'}
        <div>
          <label for="file" class="block text-sm font-medium mb-2">
            Select CVV File (.txt, .csv)
          </label>
          <input
            bind:this={fileInput}
            on:change={handleFileSelect}
            type="file"
            accept=".txt,.csv"
            class="input w-full"
          />
          <p class="text-xs text-neutral-400 mt-1">
            Supported formats: TXT, CSV. Each card should be on a separate line.
          </p>
        </div>
      {:else}
        <div>
          <label for="paste" class="block text-sm font-medium mb-2">
            Paste CVV Data
          </label>
          <textarea
            bind:value={pasteContent}
            on:input={handlePasteContent}
            placeholder="Paste your CVV data here, one card per line..."
            class="input w-full h-32"
          ></textarea>
          <p class="text-xs text-neutral-400 mt-1">
            Each card should be on a separate line with fields separated by your chosen splitter.
          </p>
        </div>
      {/if}

      <div class="mt-4">
        <label for="splitter" class="block text-sm font-medium mb-2">
          Field Splitter
        </label>
        <select bind:value={splitter} class="input w-32">
          <option value="|">Pipe (|)</option>
          <option value=",">Comma (,)</option>
          <option value=";">Semicolon (;)</option>
          <option value="\t">Tab</option>
          <option value=" ">Space</option>
        </select>
        <p class="text-xs text-neutral-400 mt-1">
          Character that separates fields in each line.
        </p>
      </div>
    </div>
  </div>

  <!-- Preview and Field Mapping -->
  {#if showPreview}
    <div class="card">
      <div class="card-header">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Field Mapping</h2>
          <button on:click={autoMapFields} class="btn btn-sm btn-secondary">
            Auto-Map Fields
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label class="block text-sm font-medium mb-1">Card Number *</label>
            <select bind:value={fieldMappings.cardNumber} class="input w-full">
              <option value={-1}>Not mapped</option>
              {#each previewHeaders as header, index}
                <option value={index}>Column {index + 1}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Exp Month *</label>
            <select bind:value={fieldMappings.expMonth} class="input w-full">
              <option value={-1}>Not mapped</option>
              {#each previewHeaders as header, index}
                <option value={index}>Column {index + 1}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Exp Year *</label>
            <select bind:value={fieldMappings.expYear} class="input w-full">
              <option value={-1}>Not mapped</option>
              {#each previewHeaders as header, index}
                <option value={index}>Column {index + 1}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">CVV *</label>
            <select bind:value={fieldMappings.cvv} class="input w-full">
              <option value={-1}>Not mapped</option>
              {#each previewHeaders as header, index}
                <option value={index}>Column {index + 1}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Full Name</label>
            <select bind:value={fieldMappings.fullName} class="input w-full">
              <option value={-1}>Not mapped</option>
              {#each previewHeaders as header, index}
                <option value={index}>Column {index + 1}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Country</label>
            <select bind:value={fieldMappings.country} class="input w-full">
              <option value={-1}>Not mapped</option>
              {#each previewHeaders as header, index}
                <option value={index}>Column {index + 1}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">ZIP Code</label>
            <select bind:value={fieldMappings.zip} class="input w-full">
              <option value={-1}>Not mapped</option>
              {#each previewHeaders as header, index}
                <option value={index}>Column {index + 1}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">State</label>
            <select bind:value={fieldMappings.state} class="input w-full">
              <option value={-1}>Not mapped</option>
              {#each previewHeaders as header, index}
                <option value={index}>Column {index + 1}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">City</label>
            <select bind:value={fieldMappings.city} class="input w-full">
              <option value={-1}>Not mapped</option>
              {#each previewHeaders as header, index}
                <option value={index}>Column {index + 1}</option>
              {/each}
            </select>
          </div>
        </div>

        <!-- Data Preview -->
        <div class="mt-6">
          <h3 class="text-sm font-medium mb-2">Data Preview (First 10 rows)</h3>
          <div class="overflow-x-auto">
            <table class="table w-full text-xs">
              <thead>
                <tr>
                  {#each previewHeaders as header, index}
                    <th class="text-center">
                      Column {index + 1}
                      {#each Object.entries(fieldMappings) as [field, mappedIndex]}
                        {#if mappedIndex === index}
                          <div class="text-blue-400 font-medium">({field})</div>
                        {/if}
                      {/each}
                    </th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each previewData as row}
                  <tr>
                    {#each row as cell}
                      <td class="font-mono truncate max-w-[100px]">{cell}</td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Upload Button -->
        <div class="mt-6 flex justify-center">
          <button
            on:click={uploadCards}
            disabled={isUploading}
            class="btn btn-primary btn-lg"
          >
            {#if isUploading}
              Uploading...
            {:else}
              Upload Cards
            {/if}
          </button>
        </div>

        {#if uploadProgress}
          <div class="mt-4 text-center">
            <p class="text-neutral-400">{uploadProgress}</p>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Help Information -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-semibold">Upload Guidelines</h2>
    </div>
    <div class="card-body text-sm">
      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-medium mb-2">Required Fields:</h3>
          <ul class="list-disc list-inside space-y-1 text-neutral-400">
            <li>Card Number (16 digits)</li>
            <li>Expiry Month (MM format)</li>
            <li>Expiry Year (YY or YYYY format)</li>
            <li>CVV (3-4 digits)</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">Optional Fields:</h3>
          <ul class="list-disc list-inside space-y-1 text-neutral-400">
            <li>Cardholder Name</li>
            <li>Country, State, City, ZIP</li>
            <li>Phone, Email</li>
            <li>Additional billing information</li>
          </ul>
        </div>
      </div>
      
      <div class="mt-4">
        <h3 class="font-medium mb-2">Example Format:</h3>
        <div class="bg-neutral-800 p-3 rounded font-mono text-xs">
          4532123456789012|12|2025|123|John Doe|US|90210|CA|Los Angeles<br>
          5555444433332222|03|2026|456|Jane Smith|UK|SW1A 1AA|London|London
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .card {
    background-color: rgb(23 23 23);
    border-radius: 0.5rem;
    border: 1px solid rgb(64 64 64);
  }
  
  .card-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgb(64 64 64);
  }
  
  .card-body {
    padding: 1rem 1.5rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-primary {
    background-color: rgb(37 99 235);
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background-color: rgb(29 78 216);
  }
  
  .btn-secondary {
    background-color: rgb(64 64 64);
    color: white;
  }
  
  .btn-secondary:hover:not(:disabled) {
    background-color: rgb(82 82 82);
  }
  
  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }

  .btn-lg {
    padding: 0.75rem 2rem;
    font-size: 1.125rem;
  }

  .input, .select {
    background-color: rgb(38 38 38);
    border: 1px solid rgb(64 64 64);
    border-radius: 0.375rem;
    padding: 0.5rem 0.75rem;
    color: white;
    width: 100%;
  }
  
  .input:focus, .select:focus {
    border-color: rgb(59 130 246);
    outline: none;
  }

  .radio {
    accent-color: rgb(37 99 235);
  }

  .table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .table th {
    background-color: rgb(38 38 38);
    text-align: left;
    padding: 0.75rem;
    font-weight: 500;
    font-size: 0.875rem;
  }
  
  .table td {
    padding: 0.75rem;
    border-bottom: 1px solid rgb(64 64 64);
  }
</style>
