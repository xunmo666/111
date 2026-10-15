<template>
  <div>
    <div class="flex items-center gap-4 mb-2">
      <span class="text-sm text-gray-600">商品图片</span>
      <span class="text-xs text-gray-400">最多 {{ max }} 张，自动压缩到 1280×1280</span>
    </div>

    <div class="flex flex-wrap gap-3">
      <!-- 已有图片预览 -->
      <div
        v-for="(url, idx) in previewUrls"
        :key="idx"
        class="relative w-24 h-24 rounded-md overflow-hidden border border-gray-200 group"
      >
        <img :src="url" class="w-full h-full object-cover" />
        <button
          class="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity"
          @click="remove(idx)"
        >✕</button>
      </div>

      <!-- 添加按钮 -->
      <label
        v-if="blobs.length < max"
        class="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-green-400 hover:text-green-500 transition-colors"
      >
        <span class="text-2xl leading-none">＋</span>
        <span class="text-xs mt-1">添加图片</span>
        <input
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="onPick"
        />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { compressImage } from '@/utils/imageCompress'

const props = withDefaults(defineProps<{
  modelValue: Blob[]
  max?: number
}>(), { max: 6 })

const emit = defineEmits<{
  (e: 'update:modelValue', blobs: Blob[]): void
}>()

const blobs = ref<Blob[]>([...(props.modelValue ?? [])])
const previewUrls = ref<string[]>([])

// 同步外部传入 → 生成 URL
watch(() => props.modelValue, (v) => {
  // 释放旧 URL
  previewUrls.value.forEach(url => URL.revokeObjectURL(url))
  previewUrls.value = []
  blobs.value = [...(v ?? [])]
  blobs.value.forEach(b => previewUrls.value.push(URL.createObjectURL(b)))
}, { immediate: true, deep: true })

onBeforeUnmount(() => {
  previewUrls.value.forEach(url => URL.revokeObjectURL(url))
})

async function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (!files.length) return

  // 检查是否超出
  const remaining = props.max - blobs.value.length
  if (files.length > remaining) {
    ElMessage.warning(`最多还能加 ${remaining} 张，已忽略多余的`)
    files.length = remaining
  }

  try {
    const compressed = await Promise.all(files.map(f => compressImage(f)))
    compressed.forEach(blob => {
      blobs.value.push(blob)
      previewUrls.value.push(URL.createObjectURL(blob))
    })
    emit('update:modelValue', blobs.value)
  } catch (err) {
    ElMessage.error('图片处理失败：' + (err as Error).message)
  }

  // 清空 input 以便重复选同一张
  input.value = ''
}

function remove(idx: number) {
  URL.revokeObjectURL(previewUrls.value[idx])
  blobs.value.splice(idx, 1)
  previewUrls.value.splice(idx, 1)
  emit('update:modelValue', blobs.value)
}
</script>
