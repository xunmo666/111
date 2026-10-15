<template>
  <div class="min-h-screen bg-gray-50">
    <TopBar />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import TopBar from '@/components/TopBar.vue'
</script>
