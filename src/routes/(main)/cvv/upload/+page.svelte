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

  onMount(() => {
    if (!canUpload) {
      goto('/cvv');
    }
  });

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    selectedFile = target.files?.[0] || null;
    if (selectedFile) {
      readFileContent();
    }
  }

  function readFileContent() {
    if (!selectedFile) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      parseContent(content);
    };
    reader.readAsText(selectedFile);
  }

  function parseContent(content: string) {
    const lines = content.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return;

    // Parse using the selected splitter
    previewData = lines.slice(0, 10).map(line => line.split(splitter)); // Show first 10 rows
    previewHeaders = Array.from({ length: Math.max(...previewData.map(row => row.length)) }, (_, i) => `Column ${i + 1}`);
    showPreview = true;
  }

  function handlePasteContent() {
    if (pasteContent.trim()) {
      parseContent(pasteContent);
    }
  }

  function resetFieldMappings() {
    Object.keys(fieldMappings).forEach(key => {
      fieldMappings[key] = -1;
    });
  }

  async function handleUpload() {
    if (!canUpload) return;
    
    // Validate required fields are mapped
    if (fieldMappings.cardNumber === -1 || fieldMappings.expMonth === -1 || 
        fieldMappings.expYear === -1 || fieldMappings.cvv === -1) {
      alert('Please map at least Card Number, Exp Month, Exp Year, and CVV fields');
      return;
    }

    isUploading = true;
    uploadProgress = 'Preparing upload...';

    try {
      const content = uploadMethod === 'file' ? 
        (selectedFile ? await selectedFile.text() : '') : 
        pasteContent;

      const formData = new FormData();
      formData.append('content', content);
      formData.append('splitter', splitter);
      formData.append('fieldMappings', JSON.stringify(fieldMappings));

      uploadProgress = 'Uploading cards...';
      
      const response = await fetch('/cvv/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        uploadProgress = `Successfully uploaded ${result.count} cards!`;
        setTimeout(() => {
          goto('/cvv/seller/dashboard');
        }, 2000);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      uploadProgress = `Error: ${error.message}`;
      isUploading = false;
    }
  }

  // Auto-detect common field patterns
  function autoDetectFields() {
    resetFieldMappings();
    
    if (previewData.length === 0) return;
    
    const firstRow = previewData[0];
    firstRow.forEach((cell, index) => {
      const cellLower = cell.toLowerCase();
      
      // Auto-detect based on content patterns
      if (/^\d{13,19}$/.test(cell)) {
        fieldMappings.cardNumber = index;
      } else if (/^(0[1-9]|1[0-2])$/.test(cell)) {
        fieldMappings.expMonth = index;
      } else if (/^\d{2,4}$/.test(cell) && parseInt(cell) > 23) {
        fieldMappings.expYear = index;
      } else if (/^\d{3,4}$/.test(cell)) {
        fieldMappings.cvv = index;
      } else if (/^\d{5}(-\d{4})?$/.test(cell)) {
        fieldMappings.zip = index;
      } else if (/@/.test(cell)) {
        fieldMappings.email = index;
      } else if (/^\+?\d{10,15}$/.test(cell)) {
        fieldMappings.phone = index;
      }
    });
  }
</script>

<svelte:head>
  <title>Upload Cards - CVV System</title>
</svelte:head>

{#if !canUpload}
  <div class="flex items-center justify-center min-h-96">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-red-500 mb-2">Access Denied</h2>
      <p class="text-neutral-400">You need seller permissions to upload cards.</p>
    </div>
  </div>
{:else}
  <div class="max-w-6xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">Upload Credit Cards</h1>
      <a href="/cvv/seller/dashboard" class="btn btn-secondary">
        ← Back to Dashboard
      </a>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="text-xl font-semibold">Upload Method</h2>
      </div>
      <div class="card-body space-y-4">
        <!-- Upload Method Selection -->
        <div class="flex gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              bind:group={uploadMethod} 
              value="file"
              class="radio"
            />
            <span>Upload File (.txt, .csv)</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              bind:group={uploadMethod} 
              value="paste"
              class="radio"
            />
            <span>Paste Content</span>
          </label>
        </div>

        <!-- File Upload -->
        {#if uploadMethod === 'file'}
          <div>
            <label for="file-upload" class="block text-sm font-medium mb-2">Select File</label>
            <input
              id="file-upload"
              type="file"
              accept=".txt,.csv"
              bind:this={fileInput}
              on:change={handleFileSelect}
              class="file-input w-full"
            />
          </div>
        {/if}

        <!-- Paste Content -->
        {#if uploadMethod === 'paste'}
          <div>
            <label for="paste-content" class="block text-sm font-medium mb-2">Paste Card Data</label>
            <textarea
              id="paste-content"
              bind:value={pasteContent}
              on:input={handlePasteContent}
              placeholder="Paste your card data here..."
              class="textarea w-full h-32"
            ></textarea>
          </div>
        {/if}

        <!-- Splitter Selection -->
        <div>
          <label for="splitter-select" class="block text-sm font-medium mb-2">Data Splitter</label>
          <select id="splitter-select" bind:value={splitter} on:change={() => showPreview && parseContent(uploadMethod === 'file' ? '' : pasteContent)} class="select w-32">
            <option value="|">Pipe (|)</option>
            <option value=",">Comma (,)</option>
            <option value="	">Tab</option>
            <option value=";">Semicolon (;)</option>
            <option value=" ">Space</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Preview and Field Mapping -->
    {#if showPreview}
      <div class="card">
        <div class="card-header flex justify-between items-center">
          <h2 class="text-xl font-semibold">Data Preview & Field Mapping</h2>
          <button 
            on:click={autoDetectFields}
            class="btn btn-secondary btn-sm"
          >
            Auto-Detect Fields
          </button>
        </div>
        <div class="card-body space-y-4">
          <!-- Field Mapping -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {#each Object.keys(fieldMappings) as field, fieldIndex}
              <div>
                <label for="field-{fieldIndex}" class="block text-sm font-medium mb-1 capitalize">
                  {field.replace(/([A-Z])/g, ' $1').trim()}
                  {#if ['cardNumber', 'expMonth', 'expYear', 'cvv'].includes(field)}
                    <span class="text-red-500">*</span>
                  {/if}
                </label>
                <select id="field-{fieldIndex}" bind:value={fieldMappings[field]} class="select w-full text-sm">
                  <option value={-1}>-- Not Mapped --</option>
                  {#each previewHeaders as header, index}
                    <option value={index}>{header}</option>
                  {/each}
                </select>
              </div>
            {/each}
          </div>

          <!-- Data Preview Table -->
          <div class="overflow-x-auto">
            <table class="table table-compact w-full">
              <thead>
                <tr>
                  {#each previewHeaders as header}
                    <th class="text-xs">{header}</th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each previewData as row}
                  <tr>
                    {#each row as cell}
                      <td class="text-xs font-mono">{cell}</td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          
          <p class="text-sm text-neutral-400">
            Showing first 10 rows. Total rows will be processed during upload.
          </p>
        </div>
      </div>

      <!-- Upload Button -->
      <div class="card">
        <div class="card-body">
          <button
            on:click={handleUpload}
            disabled={isUploading}
            class="btn btn-primary w-full"
          >
            {#if isUploading}
              Uploading...
            {:else}
              Upload Cards
            {/if}
          </button>
          
          {#if uploadProgress}
            <p class="text-center mt-2 text-sm {isUploading ? 'text-blue-400' : 'text-green-400'}">
              {uploadProgress}
            </p>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}

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
    transition: colors 0.2s;
  }
  
  .btn-primary {
    background-color: rgb(37 99 235);
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background-color: rgb(29 78 216);
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background-color: rgb(64 64 64);
    color: white;
  }
  
  .btn-secondary:hover {
    background-color: rgb(82 82 82);
  }
  
  .btn-sm {
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
  }

  .file-input, .textarea, .select {
    background-color: rgb(38 38 38);
    border: 1px solid rgb(64 64 64);
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    color: white;
  }
  
  .file-input:focus, .textarea:focus, .select:focus {
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
  }
  
  .table td {
    padding: 0.75rem;
    border-bottom: 1px solid rgb(64 64 64);
  }
  
  .table-compact th,
  .table-compact td {
    padding: 0.5rem;
  }
</style>
