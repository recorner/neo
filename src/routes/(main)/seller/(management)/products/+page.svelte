<script lang="ts">
  import type { PageData } from './$types';
  import { Package, Plus, Eye, Edit3, TrendingUp, AlertCircle, CheckCircle, XCircle } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';

  export let data: PageData;

  function getStockStatus(stock: any, type: string) {
    if (type === 'DOWNLOAD') return { status: 'unlimited', color: 'text-blue-400', icon: CheckCircle };
    const numStock = typeof stock === 'string' ? parseInt(stock) : stock;
    if (numStock === 0) return { status: 'out-of-stock', color: 'text-red-400', icon: XCircle };
    if (numStock < 10) return { status: 'low-stock', color: 'text-yellow-400', icon: AlertCircle };
    return { status: 'in-stock', color: 'text-green-400', icon: CheckCircle };
  }

  function getStatusText(stock: any, type: string) {
    if (type === 'DOWNLOAD') return 'Unlimited';
    const numStock = typeof stock === 'string' ? parseInt(stock) : stock;
    if (numStock === 0) return 'Out of Stock';
    if (numStock < 10) return 'Low Stock';
    return 'In Stock';
  }
</script>

<div class="space-y-6">
  <!-- Header with Stats -->
  <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
    <div>
      <h1 class="text-2xl font-bold text-white mb-2">Product Management</h1>
      <p class="text-neutral-400">Manage your products, inventory, and performance</p>
    </div>
    <a href="/seller/products/new" class="btn bg-blue-600 hover:bg-blue-700 flex items-center gap-2 w-max">
      <Icon src={Plus} class="w-4 h-4" />
      Create Product
    </a>
  </div>

  <!-- Quick Stats -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div class="card bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-neutral-400">Total Products</p>
          <p class="text-2xl font-bold text-blue-400">{data.products.length}</p>
        </div>
        <Icon src={Package} class="w-8 h-8 text-blue-400" />
      </div>
    </div>
    
    <div class="card bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-neutral-400">In Stock</p>
          <p class="text-2xl font-bold text-green-400">
            {data.products.filter(p => p.type === 'DOWNLOAD' || (typeof p.stock === 'string' ? parseInt(p.stock) : p.stock) > 0).length}
          </p>
        </div>
        <Icon src={CheckCircle} class="w-8 h-8 text-green-400" />
      </div>
    </div>
    
    <div class="card bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-neutral-400">Low Stock</p>
          <p class="text-2xl font-bold text-yellow-400">
            {data.products.filter(p => {
              if (p.type === 'DOWNLOAD') return false;
              const stock = typeof p.stock === 'string' ? parseInt(p.stock) : p.stock;
              return stock > 0 && stock < 10;
            }).length}
          </p>
        </div>
        <Icon src={AlertCircle} class="w-8 h-8 text-yellow-400" />
      </div>
    </div>
    
    <div class="card bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-neutral-400">Out of Stock</p>
          <p class="text-2xl font-bold text-red-400">
            {data.products.filter(p => {
              if (p.type === 'DOWNLOAD') return false;
              const stock = typeof p.stock === 'string' ? parseInt(p.stock) : p.stock;
              return stock === 0;
            }).length}
          </p>
        </div>
        <Icon src={XCircle} class="w-8 h-8 text-red-400" />
      </div>
    </div>
  </div>

  <!-- Products Table -->
  {#if data.products.length === 0}
    <div class="card text-center py-12">
      <Icon src={Package} class="w-16 h-16 text-neutral-500 mx-auto mb-4" />
      <h3 class="text-xl font-semibold text-neutral-300 mb-2">No Products Yet</h3>
      <p class="text-neutral-400 mb-6">Start by creating your first product to begin selling</p>
      <a href="/seller/products/new" class="btn bg-blue-600 hover:bg-blue-700 w-max mx-auto flex items-center gap-2">
        <Icon src={Plus} class="w-4 h-4" />
        Create Your First Product
      </a>
    </div>
  {:else}
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-neutral-700">
              <th class="text-left py-4 px-4 font-semibold text-sm text-neutral-300">Product</th>
              <th class="text-left py-4 px-4 font-semibold text-sm text-neutral-300">Category</th>
              <th class="text-left py-4 px-4 font-semibold text-sm text-neutral-300">Type</th>
              <th class="text-left py-4 px-4 font-semibold text-sm text-neutral-300">Price</th>
              <th class="text-left py-4 px-4 font-semibold text-sm text-neutral-300">Stock Status</th>
              <th class="text-right py-4 px-4 font-semibold text-sm text-neutral-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.products as product, index}
              {@const stockStatus = getStockStatus(product.stock, product.type)}
              <tr class="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                <td class="py-4 px-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {product.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 class="font-medium text-white">{product.name}</h4>
                      <p class="text-xs text-neutral-400">ID: {product.id}</p>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-700 text-neutral-300">
                    {product.category.name}
                  </span>
                </td>
                <td class="py-4 px-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {product.type === 'DOWNLOAD' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}">
                    {product.type === 'DOWNLOAD' ? 'Download' : 'License'}
                  </span>
                </td>
                <td class="py-4 px-4">
                  <span class="font-mono text-green-400 font-semibold">${product.price.toFixed(2)}</span>
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-2">
                    <Icon src={stockStatus.icon} class="w-4 h-4 {stockStatus.color}" />
                    <span class="text-sm {stockStatus.color}">
                      {getStatusText(product.stock, product.type)}
                    </span>
                    {#if product.type !== 'DOWNLOAD'}
                      <span class="text-xs text-neutral-500">({product.stock})</span>
                    {/if}
                  </div>
                </td>
                <td class="py-4 px-4">
                  <div class="flex justify-end gap-2">
                    <a 
                      href="/product/{product.id}" 
                      class="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm transition-colors"
                      title="View Product"
                    >
                      <Icon src={Eye} class="w-3 h-3" />
                      View
                    </a>
                    <a 
                      href="/seller/products/{product.id}" 
                      class="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                      title="Edit Product"
                    >
                      <Icon src={Edit3} class="w-3 h-3" />
                      Edit
                    </a>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<style>
  table {
    border-collapse: separate;
    border-spacing: 0;
  }
  
  th {
    position: sticky;
    top: 0;
    background: rgb(38 38 38);
    z-index: 10;
  }
  
  tbody tr:last-child {
    border-bottom: none;
  }
</style>
