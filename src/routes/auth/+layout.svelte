<script lang="ts">
  import Logo from '$lib/logo.svg';
  import Auth from '$lib/auth.jpeg';
</script>

<div class="grid lg:grid-cols-[35rem_auto] h-screen">
  <div class="p-6 flex flex-col justify-center max-w-md mx-auto w-full">
    <div class="flex items-center gap-3 mb-6">
      <img src={Logo} alt="Logo" class="w-6 h-6" />
      <h1 class="text-blue-400 text-xl font-montserrat font-bold">Untouchable</h1>
    </div>
    <slot />
  </div>
  <img src={Auth} alt="" class="object-cover h-full hidden lg:block" />
</div>
