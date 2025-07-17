<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let showFilters = false;
  let chartCanvas: HTMLCanvasElement;

  // Filter form data
  let filterForm = {
    status: data.filters.status || 'all',
    userId: data.filters.userId || '',
    startDate: data.filters.startDate || '',
    endDate: data.filters.endDate || '',
    search: data.filters.search || '',
    limit: data.pagination.limit || 25
  };

  function getStatusBadge(deposit: any) {
    const status = deposit.status || (deposit.completed ? 'confirmed' : 'pending');
    
    switch (status) {
      case 'confirmed':
        return { class: 'bg-green-500/20 text-green-400 border border-green-500/30', text: 'CONFIRMED', icon: '✅' };
      case 'expired':
        return { class: 'bg-orange-500/20 text-orange-400 border border-orange-500/30', text: 'EXPIRED', icon: '⏰' };
      case 'failed':
        return { class: 'bg-red-500/20 text-red-400 border border-red-500/30', text: 'FAILED', icon: '❌' };
      default:
        return { class: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', text: 'PENDING', icon: '⏳' };
    }
  }

  function applyFilters() {
    const params = new URLSearchParams();
    
    if (filterForm.status !== 'all') params.set('status', filterForm.status);
    if (filterForm.userId) params.set('userId', filterForm.userId);
    if (filterForm.startDate) params.set('startDate', filterForm.startDate);
    if (filterForm.endDate) params.set('endDate', filterForm.endDate);
    if (filterForm.search) params.set('search', filterForm.search);
    if (filterForm.limit !== 25) params.set('limit', filterForm.limit.toString());
    
    goto(`/admin/deposits?${params.toString()}`);
  }

  function clearFilters() {
    filterForm = {
      status: 'all',
      userId: '',
      startDate: '',
      endDate: '',
      search: '',
      limit: 25
    };
    goto('/admin/deposits');
  }

  function goToPage(pageNum: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('page', pageNum.toString());
    goto(`/admin/deposits?${params.toString()}`);
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDate(date: string | Date) {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onMount(() => {
    // Simple chart rendering using canvas
    if (chartCanvas && data.stats.chartData.length > 0) {
      const ctx = chartCanvas.getContext('2d');
      if (ctx) {
        const chartData = data.stats.chartData;
        const maxAmount = Math.max(...chartData.map(d => d.amount));
        const width = chartCanvas.width;
        const height = chartCanvas.height;
        const padding = 40;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw background
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, width, height);
        
        // Draw chart bars
        const barWidth = (width - padding * 2) / chartData.length;
        chartData.forEach((data, index) => {
          const barHeight = (data.amount / maxAmount) * (height - padding * 2);
          const x = padding + index * barWidth;
          const y = height - padding - barHeight;
          
          // Draw bar
          ctx.fillStyle = '#10b981';
          ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
          
          // Draw amount text
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(
            `$${data.amount.toFixed(0)}`,
            x + barWidth / 2,
            y - 5
          );
        });
      }
    }
  });
</script>

<svelte:head>
  <title>Deposit History - Admin Dashboard</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-white mb-2">Deposit History</h1>
      <p class="text-gray-400">Monitor all user deposits and payment transactions</p>
    </div>
    
    <button
      on:click={() => showFilters = !showFilters}
      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
    >
      <span>🔍</span>
      Filters
    </button>
  </div>

  <!-- Statistics Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div class="bg-gray-900/50 backdrop-blur border border-gray-700/50 rounded-xl p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-400">Total Revenue</p>
          <p class="text-2xl font-bold text-green-400 mt-1">
            {formatCurrency(data.stats.total.amount)}
          </p>
        </div>
        <div class="p-3 bg-green-500/20 rounded-lg">
          <span class="text-2xl">💰</span>
        </div>
      </div>
    </div>

    <div class="bg-gray-900/50 backdrop-blur border border-gray-700/50 rounded-xl p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-400">This Month</p>
          <p class="text-2xl font-bold text-blue-400 mt-1">
            {formatCurrency(data.stats.monthly.amount)}
          </p>
        </div>
        <div class="p-3 bg-blue-500/20 rounded-lg">
          <span class="text-2xl">📈</span>
        </div>
      </div>
    </div>

    <div class="bg-gray-900/50 backdrop-blur border border-gray-700/50 rounded-xl p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-400">Total Deposits</p>
          <p class="text-2xl font-bold text-white mt-1">
            {data.stats.total.count.toLocaleString()}
          </p>
        </div>
        <div class="p-3 bg-purple-500/20 rounded-lg">
          <span class="text-2xl">📊</span>
        </div>
      </div>
    </div>

    <div class="bg-gray-900/50 backdrop-blur border border-gray-700/50 rounded-xl p-6">
      <div class="flex items-start justify-between">
        <div class="flex-1 pr-4">
          <p class="text-sm font-medium text-gray-400 mb-3">Status Breakdown</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
            {#each data.stats.statusBreakdown as status}
              {@const statusInfo = getStatusBadge({status: status.status})}
              <div class="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg min-w-0">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <span class="text-sm flex-shrink-0">{statusInfo.icon}</span>
                  <span class="text-xs text-gray-300 capitalize truncate">{status.status}</span>
                </div>
                <span class="text-sm font-semibold text-white flex-shrink-0 ml-2">{status._count}</span>
              </div>
            {/each}
          </div>
        </div>
        <div class="p-3 bg-gray-500/20 rounded-lg flex-shrink-0">
          <span class="text-2xl">📋</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Revenue Chart -->
  {#if data.stats.chartData.length > 0}
    <div class="bg-gray-900/50 backdrop-blur border border-gray-700/50 rounded-xl p-6 mb-8">
      <h2 class="text-xl font-semibold text-white mb-4">Daily Revenue (Last 30 Days)</h2>
      <canvas
        bind:this={chartCanvas}
        width="800"
        height="200"
        class="w-full h-48 rounded-lg"
      ></canvas>
    </div>
  {/if}

  <!-- Filters -->
  {#if showFilters}
    <div class="bg-gray-900/50 backdrop-blur border border-gray-700/50 rounded-xl p-6 mb-8">
      <h2 class="text-xl font-semibold text-white mb-4">Filters</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <label for="status-filter" class="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <select
            id="status-filter"
            bind:value={filterForm.status}
            class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div>
          <label for="userId-filter" class="block text-sm font-medium text-gray-300 mb-2">User ID</label>
          <input
            id="userId-filter"
            type="number"
            bind:value={filterForm.userId}
            placeholder="Enter user ID"
            class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label for="search-filter" class="block text-sm font-medium text-gray-300 mb-2">Search</label>
          <input
            id="search-filter"
            type="text"
            bind:value={filterForm.search}
            placeholder="Payment ID or username"
            class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label for="startDate-filter" class="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
          <input
            id="startDate-filter"
            type="date"
            bind:value={filterForm.startDate}
            class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label for="endDate-filter" class="block text-sm font-medium text-gray-300 mb-2">End Date</label>
          <input
            id="endDate-filter"
            type="date"
            bind:value={filterForm.endDate}
            class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label for="limit-filter" class="block text-sm font-medium text-gray-300 mb-2">Per Page</label>
          <select
            id="limit-filter"
            bind:value={filterForm.limit}
            class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          on:click={applyFilters}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Apply Filters
        </button>
        <button
          on:click={clearFilters}
          class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>
  {/if}

  <!-- Deposits Table -->
  <div class="bg-gray-900/50 backdrop-blur border border-gray-700/50 rounded-xl overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-700/50">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-white">
          Deposits ({data.pagination.totalCount.toLocaleString()})
        </h2>
        <div class="text-sm text-gray-400">
          Showing {((data.pagination.currentPage - 1) * data.pagination.limit) + 1} - 
          {Math.min(data.pagination.currentPage * data.pagination.limit, data.pagination.totalCount)} 
          of {data.pagination.totalCount.toLocaleString()}
        </div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-800/50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              User
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Amount
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Payment ID
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Date
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-700/50">
          {#each data.deposits as deposit}
            {@const statusBadge = getStatusBadge(deposit)}
            <tr class="hover:bg-gray-800/30 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div>
                    <div class="text-sm font-medium text-white">
                      {deposit.user.username}
                    </div>
                    <div class="text-sm text-gray-400">
                      ID: {deposit.user.id}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-semibold text-white">
                  {formatCurrency(deposit.amount)}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {statusBadge.class}">
                  <span class="mr-1">{statusBadge.icon}</span>
                  {statusBadge.text}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-300 font-mono">
                  {deposit.reference || 'N/A'}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-300">
                  {formatDate(deposit.createdAt)}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                  <a
                    href="/admin/users/{deposit.user.id}"
                    class="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View User
                  </a>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if data.pagination.totalPages > 1}
      <div class="px-6 py-4 border-t border-gray-700/50 bg-gray-800/30">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button
              on:click={() => goToPage(data.pagination.currentPage - 1)}
              disabled={!data.pagination.hasPrev}
              class="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              Previous
            </button>
            
            <span class="text-sm text-gray-300">
              Page {data.pagination.currentPage} of {data.pagination.totalPages}
            </span>
            
            <button
              on:click={() => goToPage(data.pagination.currentPage + 1)}
              disabled={!data.pagination.hasNext}
              class="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              Next
            </button>
          </div>
          
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-400">Go to page:</span>
            <input
              type="number"
              min="1"
              max={data.pagination.totalPages}
              on:change={(e) => {
                const target = e.target as HTMLInputElement;
                const page = parseInt(target.value);
                if (page >= 1 && page <= data.pagination.totalPages) {
                  goToPage(page);
                }
              }}
              class="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            />
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  canvas {
    image-rendering: -moz-crisp-edges;
    image-rendering: -webkit-crisp-edges;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }
</style>
