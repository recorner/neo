<script lang="ts">
  import { goto } from '$app/navigation';
  import { hashColor } from '$lib/cUtils';
  import { ChevronLeft, ChevronRight } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import type { PageData } from './$types';

  export let data: PageData;

  const goToPage = (page: number) => {
    if (page < 1 || page > data.pages || page === data.page) return;
    // set the page number in the URL search params
    goto(`/admin/users?page=${page}`);
  };
</script>

<table class="card w-full overflow-hidden">
  <thead>
    <th>Username</th>
    <th>Roles</th>
    <th>Balance</th>
    <th>Registered</th>
    <th />
  </thead>
  <tbody>
    {#each data.users as user}
      <tr>
        <td>{user.username}</td>
        <td class="flex gap-1 flex-wrap">
          {#each user.role as role}
            <span class="rounded-full text-xs px-2 py-1" style={`background-color:${hashColor(role)}`}>{role}</span>
          {/each}
        </td>
        <td>${user.balance.toFixed(2)}</td>
        <td>{new Date(user.createdAt).toLocaleString('en-GB', { timeStyle: 'short', dateStyle: 'short' })}</td>
        <td class="flex justify-end">
          <a href="/admin/users/{user.id}" class="btn w-max">View</a>
        </td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="6" class="text-center">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <p>Page</p>
            <input
              type="number"
              value={data.page}
              min={1}
              max={data.pages}
              class="bg-neutral-850 rounded-lg px-2 py-1 w-14 border border-neutral-700"
              on:change={(e) => goToPage(Number(e.target.value))}
            />
            <p>of {data.pages}</p>
          </div>
          <div class="flex items-center gap-2">
            <button class="page-btn" on:click={() => goToPage(data.page - 1)}>
              <Icon src={ChevronLeft} class="w-5 h-5" />
            </button>

            <button class="page-btn" on:click={() => goToPage(data.page + 1)}>
              <Icon src={ChevronRight} class="w-5 h-5" />
            </button>
          </div>
        </div>
      </td>
    </tr>
  </tfoot>
</table>
