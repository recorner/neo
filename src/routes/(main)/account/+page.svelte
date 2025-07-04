<script lang="ts">
  import InputWithIcon from '$lib/components/InputWithIcon.svelte';
  import type { PageData } from './$types';
  import { Hash, Key, Lock } from '@steeze-ui/feather-icons';
  import { toast } from '@zerodevx/svelte-toast';
  import toastThemes from '$lib/toastThemes';
  import { enhance } from '$app/forms';
  import qr from 'qrcode';
  import { invalidate, invalidateAll } from '$app/navigation';

  export let data: PageData;
  let twofaData = {} as any;
  let qrCode = '';
  $: twofaData?.uri &&
    qr
      .toDataURL(twofaData?.uri, {
        color: {
          dark: '#fff',
          light: '#00000000',
        },
      })
      .then((res) => (qrCode = res));
</script>

<div class="grid md:grid-cols-2 gap-4">
  <div class="card h-max">
    <h2 class="font-bold mb-2">Change Password</h2>
    <form
      class="space-y-2"
      method="post"
      action="?/updatePassword"
      use:enhance={({ formElement }) =>
        ({ result }) => {
          if (result.type == 'success') {
            toast.push('Password updated', {
              theme: toastThemes.success,
            });
          } else if (result.type == 'error') {
            toast.push(result.error.message, {
              theme: toastThemes.error,
            });
          } else if (result.type == 'failure') {
            const errorMessages = {
              password: 'Incorrect password',
              confirm: 'Passwords do not match',
            };
            toast.push(
              errorMessages[result.data.error as keyof typeof errorMessages] || 'An error occurred',
              {
                theme: toastThemes.error,
              }
            );
          }

          formElement.reset();
        }}
    >
      <InputWithIcon type="password" placeholder="Current Password" icon={Lock} name="current" />
      <InputWithIcon type="password" placeholder="New Password" icon={Lock} name="new" />
      <InputWithIcon type="password" placeholder="Confirm New Password" icon={Lock} name="confirm" />
      <button class="btn">Save</button>
    </form>
  </div>
  <div class="card h-max">
    <h2 class="font-bold mb-2">Two-Factor Authentication</h2>
    {#if twofaData?.secret}
      <form
        action="?/enable2FA"
        class="space-y-2"
        method="post"
        use:enhance={() =>
          ({ result }) => {
            if (result.type == 'success') {
              toast.push('2FA enabled', {
                theme: toastThemes.success,
              });
            } else if (result.type == 'error') {
              toast.push(result.error.message, {
                theme: toastThemes.error,
              });
            } else if (result.type == 'failure') {
              const errorMessages = {
                code: 'Invalid code',
                missing: 'Missing code',
              };
              toast.push(
                errorMessages[result.data.error as keyof typeof errorMessages] || 'An error occurred',
                {
                  theme: toastThemes.error,
                }
              );
            }

            invalidateAll();
            twofaData = {};
          }}
      >
        <img src={qrCode} alt="" />
        <InputWithIcon icon={Key} type="text" placeholder="Secret" value={twofaData.secret} disabled />
        <input type="hidden" name="secret" value={twofaData.secret} />
        <InputWithIcon icon={Hash} type="text" placeholder="Code" name="code" />
        <button class="btn">Enable</button>
      </form>
    {:else if data.twoFactorEnabled}
      <form
        action="?/disable2FA"
        method="post"
        use:enhance={() =>
          ({ result }) => {
            if (result.type == 'success') {
              toast.push('2FA disabled', {
                theme: toastThemes.success,
              });
            } else if (result.type == 'error') {
              toast.push(result.error.message, {
                theme: toastThemes.error,
              });
            }

            invalidateAll();
          }}
      >
        <button class="btn">Disable 2FA</button>
      </form>
    {:else}
      <button
        on:click={() =>
          fetch('/account/generate2FA')
            .then((res) => res.json())
            .then((res) => (twofaData = res))}
        class="btn"
      >
        Enable 2FA
      </button>
    {/if}
  </div>
</div>
