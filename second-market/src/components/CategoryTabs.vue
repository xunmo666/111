<template>
  <div class="border-b border-gray-100 bg-white">
    <el-tabs v-model="activeId" type="card" class="px-6" @tab-change="onChange">
      <el-tab-pane label="全部" :name="''" />
      <el-tab-pane
        v-for="c in categories"
        :key="c.id"
        :label="`${c.icon} ${c.name}`"
        :name="String(c.id)"
      />
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { db } from '@/db'
import type { Category } from '@/db/types'

const emit = defineEmits<{ change: [catId: number | null] }>()

const categories = ref<Category[]>([])
const activeId = ref<string>('')

async function load() {
  categories.value = await db.categories.orderBy('sortOrder').toArray()
}

function onChange() {
  emit('change', activeId.value ? Number(activeId.value) : null)
}

onMounted(load)
watch(() => categories.value.length, (len) => {
  if (!len) load()
})
</script>
