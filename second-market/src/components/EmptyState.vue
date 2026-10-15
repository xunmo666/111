<template>
  <div class="py-16 text-center text-gray-400">
    <div class="text-5xl mb-4">{{ emoji }}</div>
    <p class="text-base">{{ text }}</p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text: string; emoji?: string }>()
</script>
