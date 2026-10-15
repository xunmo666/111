<template>
  <div>
    <CategoryTabs @change="onCatChange" />

    <!-- 快捷入口行 -->
    <div class="px-6 py-3 bg-white border-b border-gray-100">
      <div class="flex items-center gap-6 text-sm">
        <div class="flex items-center gap-2">
          <span class="text-gray-500">💰 余额</span>
          <span class="font-bold text-red-500">¥{{ userStore.currentUser?.balance ?? 0 }}</span>
        </div>
        <router-link to="/cart" class="flex items-center gap-2 text-gray-600 hover:text-green-600">
          <span>🛒 购物车</span>
          <el-badge v-if="cartStore.totalCount" :value="cartStore.totalCount" />
        </router-link>
        <router-link to="/orders" class="flex items-center gap-2 text-gray-600 hover:text-green-600">
          <span>📦 我的订单</span>
        </router-link>
        <router-link to="/publish" class="ml-auto text-green-600 hover:text-green-700 font-medium">
          + 发布闲置
        </router-link>
      </div>
    </div>

    <!-- 商品网格 -->
    <div class="px-6 py-6">
      <template v-if="loading">
        <el-skeleton :rows="6" animated />
      </template>

      <template v-else-if="filtered.length">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <ProductCard
            v-for="p in filtered"
            :key="p.id"
            :product="p"
          />
        </div>
      </template>

      <EmptyState
        v-else
        text="当前分类下没有商品，去发布一个吧！"
        emoji="🛍️"
      >
        <router-link to="/publish">
          <el-button type="primary">去发布</el-button>
        </router-link>
      </EmptyState>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/db'
import type { Product } from '@/db/types'
import CategoryTabs from '@/components/CategoryTabs.vue'
import ProductCard from '@/components/ProductCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const cartStore = useCartStore()
const userStore = useUserStore()

const allProducts = ref<Product[]>([])
const loading = ref(false)
const selectedCat = ref<number | null>(null)

const filtered = computed(() => {
  let list = allProducts.value.filter(p => p.status === 'on')

  if (selectedCat.value) {
    list = list.filter(p => p.categoryId === selectedCat.value)
  }

  const q = route.query.q as string | undefined
  if (q) {
    const lower = q.toLowerCase()
    list = list.filter(p =>
      p.title.toLowerCase().includes(lower) ||
      p.desc.toLowerCase().includes(lower)
    )
  }

  return list
})

async function loadProducts() {
  loading.value = true
  try {
    allProducts.value = await db.products.toArray()
  } finally {
    loading.value = false
  }
}

function onCatChange(catId: number | null) {
  selectedCat.value = catId
}

onMounted(async () => {
  await userStore.loadAll()
  await loadProducts()
})

// 搜索查询变化时重新过滤
watch(() => route.query.q, () => { /* computed 自动响应 */ })

// 定时刷新（卖家发布新商品后自动出现）
watch(async () => route.fullPath, async () => {
  await loadProducts()
})
</script>
