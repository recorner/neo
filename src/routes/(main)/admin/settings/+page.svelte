<script lang="ts">
  import { Image, Percent, Trash } from '@steeze-ui/feather-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import SortableList from '$lib/components/SortableList.svelte';
  import type { PageData } from './$types';
  import { toast } from '@zerodevx/svelte-toast';
  import { invalidateAll } from '$app/navigation';
  import toastThemes from '$lib/toastThemes';
  import InputWithIcon from '$lib/components/InputWithIcon.svelte';
  import { enhance } from '$app/forms';

  export let data: PageData;
  let addCategoryInput = '';

  let categories = data.categories;
</script>

<div class="grid md:grid-cols-2 gap-4">
  <div class="card h-max">
    <div class="flex items-center justify-between mb-2">
      <h2 class="font-bold">Categories</h2>
      <button
        class="btn w-max"
        on:click={() => {
          fetch('/admin/settings/updateCategories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(categories),
          }).then((res) => {
            if (res.ok) {
              toast.push('Categories updated', {
                theme: toastThemes.success,
              });
              invalidateAll();
            }
          });
        }}
      >
        Save
      </button>
    </div>
    {#if categories.length === 0}
      <p class="text-neutral-300 text-sm my-5">No categories</p>
    {:else}
      <SortableList
        list={categories}
        key="id"
        let:item
        on:sort={(ev) => (categories = ev.detail.map((item, i) => ({ ...item, order: i + 1 })))}
      >
        <div
          class="span px-3 py-2 hover:bg-neutral-800 focus:bg-neutral-800 rounded-lg flex justify-between items-center"
        >
          <input
            type="text"
            class="bg-transparent w-full"
            value={item.name}
            on:change={(e) => {
              categories = categories.map((category) => {
                if (category.id === item.id) {
                  return { ...category, name: e.target.value };
                }
                return category;
              });
            }}
          />
          <div class="flex gap-2">
            <label class="hover:text-blue-400 transition">
              <input
                type="file"
                name="image"
                class="hidden"
                on:change={(e) => {
                  const formData = new FormData();
                  formData.append('id', item.id);
                  formData.append('image', e.target.files[0]);
                  fetch('/admin/settings/updateCategory', {
                    method: 'POST',
                    body: formData,
                  }).then((res) => {
                    if (res.ok) {
                      toast.push('Category image updated', {
                        theme: toastThemes.success,
                      });
                      invalidateAll();
                    }
                  });
                }}
              />
              <Icon src={Image} class="w-5 h-5" />
            </label>
            <button
              class="hover:text-red-400 transition"
              on:click={() => {
                categories = categories.filter((category) => category.id !== item.id);
              }}
            >
              <Icon src={Trash} class="w-5 h-5" />
            </button>
          </div>
        </div>
      </SortableList>
    {/if}
    <form
      class="mt-2 flex items-center"
      on:submit|preventDefault={() => {
        categories = [
          ...categories,
          {
            id: (Math.abs(categories.sort((a, b) => a.id - b.id).at(0)?.id || 0) + 1) * -1,
            name: addCategoryInput,
            image: null,
            order: categories.length + 1,
          },
        ];
        addCategoryInput = '';
      }}
    >
      <input
        class="px-3 py-2 w-full bg-transparent text-neutral-100 placeholder:text-neutral-400 text-sm bg-neutral-800 border border-neutral-700 rounded-lg focus:border-neutral-600 transition rounded-r-none border-r-0"
        placeholder="Add a category"
        bind:value={addCategoryInput}
      />
      <button class="btn w-max rounded-l-none border-blue-500 border border-l-0">Add</button>
    </form>
  </div>
  <div class="grid gap-4 h-max">
    <form
      class="card h-max"
      method="post"
      action="?/update"
      use:enhance={({ form }) =>
        async ({ result }) => {
          if (result.type === 'success') {
            toast.push('Settings updated', {
              theme: toastThemes.success,
            });
            return;
          } else {
            toast.push('Error updating settings', {
              theme: toastThemes.error,
            });
          }
          await invalidateAll();
        }}
    >
      <h2 class="font-bold mb-2">Settings</h2>
      <div class="space-y-2">
        <InputWithIcon
          icon={Percent}
          placeholder="Platform fee"
          type="number"
          min="1"
          max="99"
          name="fee"
          value={data.settings['fee']}
        />
        <button class="btn">Save</button>
      </div>
    </form>
    <form
      action="?/announce"
      method="post"
      class="card h-max"
      use:enhance={({ form }) =>
        async ({ result }) => {
          if (result.type === 'success') {
            toast.push('Announcement posted', {
              theme: toastThemes.success,
            });
            form.reset();
            return;
          } else {
            toast.push('Error posting announcement', {
              theme: toastThemes.error,
            });
          }
        }}
    >
      <h2 class="font-bold">Announce</h2>
      <p class="text-sm text-neutral-300">Post an announcement visible to all members</p>
      <div class="space-y-2">
        <textarea class="input w-full mt-2" placeholder="Announcement" name="message" />
        <button class="btn">Post</button>
      </div>
    </form>
  </div>
</div>
