<template>
  <router-link
    :to="`/product/${product.id}`"
    class="block bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-lg hover:border-green-400 transition-all group"
  >
    <div class="w-full aspect-square bg-gray-50 overflow-hidden">
      <img
        v-if="imgUrl"
        :src="imgUrl"
        :alt="product.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
        无图片
      </div>
    </div>
    <div class="p-3">
      <div class="font-medium text-sm text-gray-800 truncate">{{ product.title }}</div>
      <div class="mt-1 flex items-baseline gap-2">
        <span class="text-red-500 font-bold text-lg">¥{{ product.price }}</span>
        <span class="text-xs text-gray-400">{{ product.condition }}</span>
      </div>
      <div class="mt-1 text-xs text-gray-400 flex items-center gap-2">
        <span>👁 {{ product.viewCount }}</span>
        <span v-if="isMerchant">🏪 店铺</span>
        <span v-else>👤 C2C</span>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { Product } from '@/db/types'

const props = defineProps<{ product: Product }>()

const imgUrl = ref<string>('')

onMounted(() => {
  if (props.product.images?.[0]) {
    imgUrl.value = URL.createObjectURL(props.product.images[0])
  }
})

onBeforeUnmount(() => {
  if (imgUrl.value) URL.revokeObjectURL(imgUrl.value)
})

const isMerchant = computed(() => !!props.product.merchantId)
</script>
