<script lang="ts">
  import Logo from '$lib/logo.svg';
</script>

<div class="grid lg:grid-cols-[35rem_auto] h-screen">
  <div class="p-6 flex flex-col justify-center max-w-md mx-auto w-full">
    <div class="flex items-center gap-3 mb-6">
      <img src={Logo} alt="Logo" class="w-6 h-6" />
      <h1 class="text-blue-400 text-xl font-montserrat font-bold">project title</h1>
    </div>
    <slot />
  </div>
  <img src="https://picsum.photos/1920/1080" alt="" class="object-cover h-full hidden lg:block" />
</div>
