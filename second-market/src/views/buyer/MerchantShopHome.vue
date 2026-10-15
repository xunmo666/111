<template>
  <div class="max-w-6xl mx-auto px-6 py-6">
    <!-- 店铺不存在 -->
    <EmptyState v-if="loaded && !merchant" text="店铺不存在或已关闭" emoji="🏚️">
      <el-button @click="$router.push('/')">返回首页</el-button>
    </EmptyState>

    <template v-else-if="merchant">
      <!-- 店铺信息 -->
      <el-card shadow="never" class="mb-6">
        <div class="flex items-center gap-5">
          <div class="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center text-4xl shrink-0">
            <img v-if="logoUrl" :src="logoUrl" class="w-full h-full object-cover" />
            <span v-else>🏪</span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-bold truncate">{{ merchant.shopName }}</h2>
              <el-tag :type="statusMeta.type" size="small">{{ statusMeta.label }}</el-tag>
            </div>
            <p class="mt-1 text-sm text-gray-500">{{ merchant.shopDesc || '店主很懒，还没有填写店铺简介' }}</p>
            <div class="mt-2 text-xs text-gray-400 space-x-4">
              <span v-if="owner">店主：{{ owner.nickname }}</span>
              <span v-if="owner">📬 {{ owner.contact }}</span>
              <span>在售 {{ products.length }} 件</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 商品网格 -->
      <template v-if="products.length">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <ProductCard v-for="p in products" :key="p.id" :product="p" />
        </div>
      </template>
      <EmptyState v-else text="店铺暂无在售商品" emoji="🕸️" />
    </template>

    <el-skeleton v-else :rows="6" animated />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/db'
import type { Merchant, User, Product } from '@/db/types'
import ProductCard from '@/components/ProductCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()

const loaded = ref(false)
const merchant = ref<Merchant | null>(null)
const owner = ref<User | null>(null)
const products = ref<Product[]>([])
const logoUrl = ref('')

const merchantId = computed(() => Number(route.params.id))

const statusMeta = computed<{ label: string; type: 'success' | 'warning' | 'danger' | 'info' }>(() => {
  const map: Record<string, { label: string; type: 'success' | 'warning' | 'danger' | 'info' }> = {
    approved: { label: '营业中', type: 'success' },
    pending:  { label: '入驻审核中', type: 'warning' },
    rejected: { label: '未通过审核', type: 'danger' },
    frozen:   { label: '已冻结', type: 'info' }
  }
  return map[merchant.value?.status ?? ''] ?? { label: '未知', type: 'info' }
})

async function load() {
  loaded.value = false
  await userStore.loadAll()

  if (logoUrl.value) {
    URL.revokeObjectURL(logoUrl.value)
    logoUrl.value = ''
  }

  const m = await db.merchants.get(merchantId.value)
  merchant.value = m ?? null
  if (m) {
    owner.value = (await db.users.get(m.userId)) ?? null
    products.value = await db.products
      .where('merchantId')
      .equals(merchantId.value)
      .and(p => p.status === 'on')
      .toArray()
    if (m.shopLogo) logoUrl.value = URL.createObjectURL(m.shopLogo)
  }
  loaded.value = true
}

watch(merchantId, load)
onMounted(load)

onBeforeUnmount(() => {
  if (logoUrl.value) URL.revokeObjectURL(logoUrl.value)
})
</script>
