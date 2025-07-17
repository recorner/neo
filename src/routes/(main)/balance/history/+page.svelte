<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import { toast } from '@zerodevx/svelte-toast';
  import toastThemes from '$lib/toastThemes';
  import type { PageData } from './$types';

  export let data: PageData;

  let statusCheckingPayments = new Set<string>();
  let searchTerm = '';
  let statusFilter = 'all'; // all, pending, confirmed, failed, expired
  let paymentStatuses = new Map<string, any>(); // Store real payment statuses

  // Filter topUps based on search and status
  $: filteredTopUps = data.topUps.filter(topUp => {
    const matchesSearch = !searchTerm || 
      topUp.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topUp.amount.toString().includes(searchTerm);
    
    const currentStatus = getPaymentStatus(topUp);
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'confirmed' && currentStatus.isConfirmed) ||
      (statusFilter === 'pending' && currentStatus.isPending) ||
      (statusFilter === 'failed' && currentStatus.isFailed) ||
      (statusFilter === 'expired' && currentStatus.isExpired);
    
    return matchesSearch && matchesStatus;
  });

  // Get payment status directly from database
  function getPaymentStatus(topUp: any) {
    const status = topUp.status || (topUp.completed ? 'confirmed' : 'pending');
    
    return {
      isConfirmed: status === 'confirmed',
      isPending: status === 'pending' || status === 'waiting',
      isFailed: status === 'failed',
      isExpired: status === 'expired',
      status: status
    };
  }

  onMount(() => {
    // No auto status checking - use database data only
  });

  async function checkPaymentStatus(paymentId: string, topUpId: number, showToast: boolean = true) {
    if (statusCheckingPayments.has(paymentId)) return;
    
    statusCheckingPayments.add(paymentId);

    try {
      const response = await fetch(`/api/payment/status?id=${paymentId}`);
      const result = await response.json();

      if (response.ok && result.payment) {
        const payment = result.payment;
        
        // Store the real status
        paymentStatuses.set(paymentId, payment);
        paymentStatuses = paymentStatuses; // trigger reactivity
        
        if (showToast) {
          // Show toast with current status
          if (payment.status === 'confirmed' || payment.local_completed) {
            toast.push(`✅ Payment confirmed! +$${payment.amount}`, { 
              theme: toastThemes.success 
            });
            
            // Refresh the page data if newly confirmed
            const topUp = data.topUps.find(t => t.reference === paymentId);
            if (topUp && !topUp.completed && payment.status === 'confirmed') {
              // Payment was just confirmed, refresh page data
              setTimeout(() => {
                invalidateAll();
              }, 1000);
            }
          } else if (payment.status === 'expired') {
            toast.push(`⏰ Payment expired - Please create a new payment`, { 
              theme: toastThemes.error 
            });
          } else if (payment.status === 'failed') {
            toast.push(`❌ Payment failed - Please try again`, { 
              theme: toastThemes.error 
            });
          } else if (payment.status === 'refunded') {
            toast.push(`🔄 Payment refunded`, { 
              theme: toastThemes.warning 
            });
          } else if (payment.status === 'pending' || payment.status === 'waiting') {
            toast.push(`⏳ Payment still pending - Check again later`, { 
              theme: toastThemes.warning 
            });
          } else {
            toast.push(`📊 Status: ${payment.status}`, { 
              theme: toastThemes.warning 
            });
          }
        }
      } else if (showToast) {
        toast.push('❌ Failed to check payment status', { 
          theme: toastThemes.error 
        });
      }
    } catch (error) {
      console.error('Status check error:', error);
      if (showToast) {
        toast.push('❌ Error checking payment status', { 
          theme: toastThemes.error 
        });
      }
    } finally {
      statusCheckingPayments.delete(paymentId);
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getStatusBadge(topUp: any): { class: string; text: string; icon: string } {
    const status = getPaymentStatus(topUp);
    
    if (status.isConfirmed) {
      return {
        class: 'bg-green-500/20 text-green-400 border border-green-500/30',
        text: 'CONFIRMED',
        icon: '✅'
      };
    } else if (status.isExpired) {
      return {
        class: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
        text: 'EXPIRED',
        icon: '⏰'
      };
    } else if (status.isFailed) {
      return {
        class: 'bg-red-500/20 text-red-400 border border-red-500/30',
        text: 'FAILED',
        icon: '❌'
      };
    } else {
      return {
        class: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
        text: 'PENDING',
        icon: '⏳'
      };
    }
  }

  function navigateToPage(newPage: number) {
    goto(`?page=${newPage}`);
  }

  function copyPaymentId(paymentId: string) {
    navigator.clipboard.writeText(paymentId).then(() => {
      toast.push('Payment ID copied!', { theme: toastThemes.success });
    });
  }

  async function viewPaymentDetails(paymentId: string) {
    // Find the payment in our current data first
    const localPayment = data.topUps.find(topUp => topUp.reference === paymentId);
    
    if (localPayment) {
      // Use the database data directly with proper status
      const paymentDetails = {
        id: localPayment.reference,
        status: localPayment.status || (localPayment.completed ? 'confirmed' : 'pending'),
        amount: localPayment.amount,
        created_at: localPayment.createdAt,
        updated_at: localPayment.createdAt,
        local_completed: localPayment.completed,
        pay_address: null, // Will be fetched from API if needed
        pay_amount: null,
        pay_currency: null
      };
      
      openPaymentDetailsModal(paymentDetails);
      
      // Optionally fetch additional details from API for address/amount info
      if (localPayment.reference) {
        try {
          const response = await fetch(`/api/payment/status?id=${localPayment.reference}`);
          if (response.ok) {
            const result = await response.json();
            if (result.payment) {
              // Update with additional details but keep our database status
              const updatedDetails = {
                ...paymentDetails,
                pay_address: result.payment.pay_address,
                pay_amount: result.payment.pay_amount,
                pay_currency: result.payment.pay_currency
              };
              openPaymentDetailsModal(updatedDetails);
            }
          }
        } catch (error) {
          console.error('Failed to fetch additional payment details:', error);
        }
      }
    } else {
      toast.push('Payment not found', { theme: toastThemes.error });
    }
  }

  let showDetailsModal = false;
  let selectedPayment: any = null;

  // Get the most current payment data for the modal (prioritize database data)
  $: currentPaymentData = selectedPayment ? {
    ...selectedPayment,
    // Ensure we use the proper status from our function
    status: selectedPayment.status || (selectedPayment.local_completed ? 'confirmed' : 'pending')
  } : null;

  function openPaymentDetailsModal(payment: any) {
    selectedPayment = payment;
    showDetailsModal = true;
  }

  function closeDetailsModal() {
    showDetailsModal = false;
    selectedPayment = null;
  }

  function getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'text-green-400';
      case 'pending': case 'waiting': return 'text-yellow-400';
      case 'failed': case 'expired': case 'refunded': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }
</script>

<svelte:head>
  <title>Payment History - NeoShop</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 text-white">
  <div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Payment History
          </h1>
          <p class="text-gray-400 mt-1">Track all your cryptocurrency transactions</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <a 
            href="/balance" 
            class="inline-flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            ← Back to Balance
          </a>
          <button
            type="button"
            on:click={() => location.reload()}
            class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-gray-900/50 backdrop-blur border border-gray-700/50 rounded-xl p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-400">Total Transactions</p>
            <p class="text-2xl font-bold text-white mt-1">{data.pagination.totalCount}</p>
          </div>
          <div class="p-3 bg-blue-500/20 rounded-lg">
            <span class="text-2xl">📊</span>
          </div>
        </div>
      </div>
      
      <div class="bg-gray-900/50 backdrop-blur border border-gray-700/50 rounded-xl p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-400">Confirmed</p>
            <p class="text-2xl font-bold text-green-400 mt-1">
              {data.topUps.filter(t => getPaymentStatus(t).isConfirmed).length}
            </p>
          </div>
          <div class="p-3 bg-green-500/20 rounded-lg">
            <span class="text-2xl">✅</span>
          </div>
        </div>
      </div>
      
      <div class="bg-gray-900/50 backdrop-blur border border-gray-700/50 rounded-xl p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-400">Expired</p>
            <p class="text-2xl font-bold text-orange-400 mt-1">
              {data.topUps.filter(t => getPaymentStatus(t).isExpired).length}
            </p>
          </div>
          <div class="p-3 bg-orange-500/20 rounded-lg">
            <span class="text-2xl">⏰</span>
          </div>
        </div>
      </div>
      
      <div class="bg-gray-900/50 backdrop-blur border border-gray-700/50 rounded-xl p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-400">Total Value</p>
            <p class="text-2xl font-bold text-white mt-1">
              ${data.topUps.filter(t => getPaymentStatus(t).isConfirmed).reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
            </p>
          </div>
          <div class="p-3 bg-purple-500/20 rounded-lg">
            <span class="text-2xl">💰</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-gray-900/50 backdrop-blur border border-gray-700/50 rounded-xl p-6 mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <label for="search" class="block text-sm font-medium text-gray-300 mb-2">Search</label>
          <input
            id="search"
            type="text"
            bind:value={searchTerm}
            placeholder="Search by payment ID or amount..."
            class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div class="sm:w-48">
          <label for="status" class="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <select
            id="status"
            bind:value={statusFilter}
            class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Transactions</option>
            <option value="confirmed">Confirmed Only</option>
            <option value="pending">Pending Only</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="bg-gray-900/50 backdrop-blur border border-gray-700/50 rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-700/50 bg-gray-800/50">
        <h2 class="text-lg font-semibold text-white flex items-center gap-2">
          <span class="text-xl">💳</span>
          Transactions
          <span class="ml-auto text-sm text-gray-400">
            Showing {filteredTopUps.length} of {data.pagination.totalCount}
          </span>
        </h2>
      </div>

      {#if filteredTopUps.length === 0}
        <div class="text-center py-16">
          <div class="text-6xl mb-4">
            {data.topUps.length === 0 ? '💳' : '🔍'}
          </div>
          <h3 class="text-xl font-medium text-gray-300 mb-2">
            {data.topUps.length === 0 ? 'No transactions yet' : 'No transactions found'}
          </h3>
          <p class="text-gray-400 mb-6">
            {data.topUps.length === 0 
              ? 'Your payment history will appear here' 
              : 'Try adjusting your search or filters'}
          </p>
          {#if data.topUps.length === 0}
            <a href="/balance" class="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
              <span class="mr-2">🚀</span>
              Make Your First Top-up
            </a>
          {:else}
            <button
              type="button"
              on:click={() => { searchTerm = ''; statusFilter = 'all'; }}
              class="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          {/if}
        </div>
      {:else}
        <!-- Desktop Table -->
        <div class="hidden lg:block overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-800/70">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date & Time</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Payment ID</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/50">
              {#each filteredTopUps as topUp}
                {@const statusBadge = getStatusBadge(topUp)}
                <tr class="hover:bg-gray-800/30 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-white font-medium">
                      {formatDate(topUp.createdAt).split(',')[0]}
                    </div>
                    <div class="text-xs text-gray-400">
                      {formatDate(topUp.createdAt).split(',')[1]}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <span class="text-xl font-bold text-white">${topUp.amount.toFixed(2)}</span>
                      <span class="ml-2 text-xs text-gray-400">USD</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center space-x-2">
                      <code class="text-sm text-gray-300 bg-gray-800 px-2 py-1 rounded">
                        {topUp.reference ? `${topUp.reference.slice(0, 8)}...${topUp.reference.slice(-4)}` : 'N/A'}
                      </code>
                      {#if topUp.reference}
                        <button
                          type="button"
                          on:click={() => copyPaymentId(topUp.reference)}
                          class="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                          title="Copy Full Payment ID"
                        >
                          📋
                        </button>
                      {/if}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium {statusBadge.class}">
                      <span class="mr-1">{statusBadge.icon}</span>
                      {statusBadge.text}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center space-x-2">
                      {#if topUp.reference}
                        <button
                          type="button"
                          on:click={() => viewPaymentDetails(topUp.reference)}
                          class="px-3 py-1 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition-colors"
                        >
                          View Details
                        </button>
                      {/if}
                      {#if getPaymentStatus(topUp).isPending && topUp.reference}
                        <button
                          type="button"
                          on:click={() => checkPaymentStatus(topUp.reference, topUp.id, true)}
                          disabled={statusCheckingPayments.has(topUp.reference)}
                          class="px-3 py-1 text-xs font-medium text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {statusCheckingPayments.has(topUp.reference) ? '⏳ Checking...' : '🔄 Check Status'}
                        </button>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="lg:hidden">
          {#each filteredTopUps as topUp}
            {@const statusBadge = getStatusBadge(topUp)}
            <div class="p-6 border-b border-gray-700/50 last:border-b-0">
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <div class="text-lg font-bold text-white">${topUp.amount.toFixed(2)}</div>
                  <div class="text-sm text-gray-400">{formatDate(topUp.createdAt)}</div>
                </div>
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium {statusBadge.class}">
                  <span class="mr-1">{statusBadge.icon}</span>
                  {statusBadge.text}
                </span>
              </div>
              
              {#if topUp.reference}
                <div class="mb-4">
                  <div class="text-xs text-gray-400 mb-1">Payment ID</div>
                  <div class="flex items-center space-x-2">
                    <code class="text-sm text-gray-300 bg-gray-800 px-2 py-1 rounded flex-1">
                      {topUp.reference.slice(0, 12)}...{topUp.reference.slice(-6)}
                    </code>
                    <button
                      type="button"
                      on:click={() => copyPaymentId(topUp.reference)}
                      class="p-2 text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      📋
                    </button>
                  </div>
                </div>
              {/if}

              <div class="flex space-x-2">
                {#if topUp.reference}
                  <button
                    type="button"
                    on:click={() => viewPaymentDetails(topUp.reference)}
                    class="flex-1 px-3 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                {/if}
                {#if getPaymentStatus(topUp).isPending && topUp.reference}
                  <button
                    type="button"
                    on:click={() => checkPaymentStatus(topUp.reference, topUp.id, true)}
                    disabled={statusCheckingPayments.has(topUp.reference)}
                    class="flex-1 px-3 py-2 text-sm font-medium text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {statusCheckingPayments.has(topUp.reference) ? '⏳ Checking...' : '🔄 Check Status'}
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Enhanced Pagination -->
      {#if data.pagination.totalPages > 1}
        <div class="px-6 py-4 border-t border-gray-700/50 bg-gray-800/30">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="text-sm text-gray-400">
              Showing page {data.pagination.currentPage} of {data.pagination.totalPages} 
              ({data.pagination.totalCount} total transactions)
            </div>
            <div class="flex items-center space-x-1">
              <button
                type="button"
                on:click={() => navigateToPage(1)}
                disabled={data.pagination.currentPage === 1}
                class="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-l-lg border-r border-gray-600 transition-colors"
              >
                ⏮️
              </button>
              <button
                type="button"
                on:click={() => navigateToPage(data.pagination.currentPage - 1)}
                disabled={!data.pagination.hasPrev}
                class="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white border-r border-gray-600 transition-colors"
              >
                ⏪ Prev
              </button>
              
              {#each Array.from({length: Math.min(5, data.pagination.totalPages)}, (_, i) => {
                const startPage = Math.max(1, Math.min(data.pagination.currentPage - 2, data.pagination.totalPages - 4));
                return startPage + i;
              }).filter(p => p <= data.pagination.totalPages) as pageNum}
                <button
                  type="button"
                  on:click={() => navigateToPage(pageNum)}
                  class="px-3 py-2 text-sm border-r border-gray-600 transition-colors {pageNum === data.pagination.currentPage 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'}"
                >
                  {pageNum}
                </button>
              {/each}
              
              <button
                type="button"
                on:click={() => navigateToPage(data.pagination.currentPage + 1)}
                disabled={!data.pagination.hasNext}
                class="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white border-r border-gray-600 transition-colors"
              >
                Next ⏩
              </button>
              <button
                type="button"
                on:click={() => navigateToPage(data.pagination.totalPages)}
                disabled={data.pagination.currentPage === data.pagination.totalPages}
                class="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-r-lg transition-colors"
              >
                ⏭️
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Quick Actions -->
    <div class="mt-8 text-center space-y-4">
      <div class="flex flex-col sm:flex-row justify-center gap-4">
        <a 
          href="/balance" 
          class="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          <span class="mr-2">🚀</span>
          Make New Top-up
        </a>
        <button
          type="button"
          on:click={() => location.reload()}
          class="inline-flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
        >
          <span class="mr-2">🔄</span>
          Refresh Page
        </button>
      </div>
      <p class="text-sm text-gray-400">
        Having issues? Check your payment status or contact support.
      </p>
    </div>
  </div>
</div>

<!-- Enhanced Payment Details Modal -->
{#if showDetailsModal && selectedPayment}
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800/50">
        <div>
          <h3 class="text-xl font-semibold text-white">Payment Details</h3>
          <p class="text-sm text-gray-400 mt-1">Complete transaction information</p>
        </div>
        <button
          type="button"
          on:click={closeDetailsModal}
          class="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors"
        >
          ×
        </button>
      </div>

      <!-- Modal Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        <div class="space-y-6">
          <!-- Status Card -->
          <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-semibold text-white">Transaction Status</h4>
              <span class="text-2xl">
                {currentPaymentData.status === 'confirmed' ? '✅' : 
                 ['pending', 'waiting'].includes(currentPaymentData.status) ? '⏳' : 
                 currentPaymentData.status === 'expired' ? '⏰' :
                 currentPaymentData.status === 'failed' ? '❌' :
                 currentPaymentData.status === 'refunded' ? '🔄' : '❓'}
              </span>
            </div>
            <div class="flex items-center space-x-3">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                {currentPaymentData.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                 ['pending', 'waiting'].includes(currentPaymentData.status) ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                 currentPaymentData.status === 'expired' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                 'bg-red-500/20 text-red-400 border border-red-500/30'}">
                {currentPaymentData.status?.toUpperCase() || 'PENDING'}
              </span>
              {#if currentPaymentData.local_completed}
                <span class="text-xs text-green-400">✓ Balance Updated</span>
              {/if}
            </div>
          </div>

          <!-- Payment Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 class="font-semibold text-white mb-3">Payment Amount</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-400">USD Amount:</span>
                  <span class="font-bold text-white">${currentPaymentData.amount}</span>
                </div>
                {#if currentPaymentData.pay_amount}
                  <div class="flex justify-between">
                    <span class="text-gray-400">Crypto Amount:</span>
                    <span class="font-mono text-white">
                      {currentPaymentData.pay_amount} {currentPaymentData.pay_currency?.toUpperCase()}
                    </span>
                  </div>
                {/if}
              </div>
            </div>

            <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 class="font-semibold text-white mb-3">Transaction ID</h4>
              <div class="space-y-2">
                <div class="flex items-center space-x-2">
                  <code class="text-sm text-gray-300 bg-gray-900 px-2 py-1 rounded flex-1 break-all">
                    {selectedPayment.id}
                  </code>
                  <button
                    type="button"
                    on:click={() => copyPaymentId(selectedPayment.id)}
                    class="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                    title="Copy Payment ID"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Address (if available) -->
          {#if currentPaymentData.pay_address}
            <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 class="font-semibold text-white mb-3">Payment Address</h4>
              <div class="space-y-3">
                <div class="flex items-center space-x-2">
                  <code class="text-sm text-gray-300 bg-gray-900 px-3 py-2 rounded flex-1 break-all">
                    {currentPaymentData.pay_address}
                  </code>
                  <button
                    type="button"
                    on:click={() => copyPaymentId(currentPaymentData.pay_address)}
                    class="p-2 text-gray-400 hover:text-gray-200 transition-colors"
                    title="Copy Address"
                  >
                    📋
                  </button>
                </div>
                <p class="text-xs text-gray-400">
                  💡 Use this address to send your {currentPaymentData.pay_currency?.toUpperCase()} payment
                </p>
              </div>
            </div>
          {/if}

          <!-- Timestamps -->
          <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h4 class="font-semibold text-white mb-3">Timeline</h4>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-400">Created:</span>
                <span class="text-white">
                  {new Date(currentPaymentData.created_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>
              {#if currentPaymentData.updated_at && currentPaymentData.updated_at !== currentPaymentData.created_at}
                <div class="flex justify-between">
                  <span class="text-gray-400">Last Updated:</span>
                  <span class="text-white">
                    {new Date(currentPaymentData.updated_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
              {/if}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row gap-3">
            {#if currentPaymentData && ['pending', 'waiting'].includes(currentPaymentData.status) && !currentPaymentData.local_completed}
              <button
                type="button"
                on:click={() => {
                  if (selectedPayment?.id) {
                    checkPaymentStatus(selectedPayment.id, 0, true);
                    closeDetailsModal();
                  }
                }}
                class="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors"
              >
                🔄 Check Status Again
              </button>
            {/if}
            <button
              type="button"
              on:click={closeDetailsModal}
              class="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
