<template>
  <div v-if="product" class="px-6 py-6 max-w-5xl mx-auto">
    <el-button text @click="$router.back()" class="mb-4">← 返回</el-button>

    <div class="flex flex-col md:flex-row gap-6">
      <!-- 图片轮播 -->
      <div class="md:w-80">
        <el-carousel height="320px" indicator-position="outside">
          <el-carousel-item v-for="(url, idx) in imageUrls" :key="idx">
            <img :src="url" class="w-full h-full object-cover rounded-lg" />
          </el-carousel-item>
        </el-carousel>
      </div>

      <!-- 商品信息 -->
      <div class="flex-1">
        <h1 class="text-xl font-bold">{{ product.title }}</h1>
        <div class="mt-2 flex items-center gap-3 text-sm text-gray-500">
          <el-tag size="small">{{ product.condition }}</el-tag>
          <span>👁 {{ product.viewCount }} 浏览</span>
          <span v-if="isMerchant">🏪 店铺商品</span>
          <span v-else>👤 个人闲置</span>
        </div>

        <div class="mt-4 text-red-500 font-bold text-3xl">¥{{ product.price }}</div>

        <div class="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
          {{ product.desc }}
        </div>

        <!-- 卖家信息 -->
        <div class="mt-6 p-4 border border-gray-200 rounded-lg">
          <div class="text-sm text-gray-500 mb-2">卖家信息</div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
              {{ seller?.nickname?.[0] ?? '?' }}
            </div>
            <div>
              <div class="font-medium">{{ seller?.nickname ?? '未知' }}</div>
              <div class="text-xs text-gray-500">📱 {{ seller?.contact ?? '-' }} · {{ seller?.college ?? '-' }}</div>
            </div>
          </div>
        </div>

        <!-- 面交信息 -->
        <div class="mt-4 text-sm text-gray-500">
          📍 面交建议：{{ product.merchantId ? '商家店铺自提' : '可与卖家协商地点' }}
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center gap-3 z-40">
      <el-button
        :icon="isFav ? StarFilled : Star"
        :type="isFav ? 'warning' : 'default'"
        circle
        @click="toggleFav"
      />
      <el-button size="large" @click="onAddCart">
        🛒 加入购物车
      </el-button>
      <el-button size="large" type="primary" @click="onBuyNow">
        💳 立即购买
      </el-button>
    </div>
    <div class="h-16" />
  </div>

  <EmptyState v-else text="商品不存在或已下架" emoji="😵" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star, StarFilled } from '@element-plus/icons-vue'
import { db } from '@/db'
import type { Product, User } from '@/db/types'
import EmptyState from '@/components/EmptyState.vue'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const product = ref<Product | null>(null)
const seller = ref<User | null>(null)
const imageUrls = ref<string[]>([])
const isFav = ref(false)
const favs = ref<Set<number>>(new Set()) // 简化：仅内存收藏

const isMerchant = computed(() => !!product.value?.merchantId)

async function load(id: number) {
  const p = await db.products.get(id)
  if (!p) { product.value = null; return }

  // 浏览计数 +1
  await db.products.update(id, { viewCount: (p.viewCount || 0) + 1 })
  p.viewCount += 1

  product.value = p
  imageUrls.value = p.images?.map(b => URL.createObjectURL(b)) ?? []

  // 查卖家
  if (p.userId) {
    seller.value = await db.users.get(p.userId) ?? null
  }
}

function toggleFav() {
  if (!product.value) return
  const id = product.value.id!
  if (favs.value.has(id)) favs.value.delete(id)
  else favs.value.add(id)
  isFav.value = !isFav.value
  ElMessage.success(isFav.value ? '已收藏' : '已取消收藏')
}

async function onAddCart() {
  if (!product.value) return
  if (product.value.status !== 'on') {
    ElMessage.warning('商品已下架')
    return
  }
  await cartStore.addProduct(product.value.id!, 1)
  ElMessage.success('已加入购物车')
}

async function onBuyNow() {
  await onAddCart()
  router.push('/cart')
}

onMounted(() => {
  const id = Number(route.params.id)
  if (!isNaN(id)) load(id)
})

onBeforeUnmount(() => {
  imageUrls.value.forEach(url => URL.revokeObjectURL(url))
})
</script>
