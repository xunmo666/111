<template>
  <div class="p-6">
    <h2 class="text-xl font-bold mb-4">📊 平台概览</h2>

    <!-- 4 个数字卡片 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <el-card shadow="hover">
        <div class="text-xs text-gray-400">销售总额</div>
        <div class="text-2xl font-bold text-red-500 mt-1">{{ fmtMoney(saleTotal) }}</div>
        <div class="text-xs text-gray-400 mt-1">不含待付款订单</div>
      </el-card>

      <el-card shadow="hover">
        <div class="text-xs text-gray-400">订单总数</div>
        <div class="text-2xl font-bold text-blue-500 mt-1">{{ orderCount }}</div>
      </el-card>

      <el-card shadow="hover">
        <div class="text-xs text-gray-400">在售商品数</div>
        <div class="text-2xl font-bold text-green-500 mt-1">{{ onSaleCount }}</div>
      </el-card>

      <el-card shadow="hover">
        <div class="text-xs text-gray-400">活跃商家数</div>
        <div class="text-2xl font-bold text-orange-500 mt-1">{{ activeMerchantCount }}</div>
      </el-card>
    </div>

    <!-- 两个审核队列预览 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
      <!-- 商品审核队列 -->
      <el-card shadow="never">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-medium">✅ 商品审核队列</span>
            <router-link to="/admin/products">
              <el-button link type="primary">全部 →</el-button>
            </router-link>
          </div>
        </template>

        <template v-if="pendingProducts.length">
          <div
            v-for="p in pendingProducts"
            :key="p.id"
            class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
          >
            <div class="flex-1 min-w-0">
              <div class="text-sm text-gray-800 truncate">{{ p.title }}</div>
              <div class="text-xs text-gray-400">{{ fmtMoney(p.price) }} · {{ p.condition }}</div>
            </div>
            <el-button size="small" type="success" @click="approveProduct(p.id!)">通过</el-button>
            <el-button size="small" type="danger" plain @click="offlineProduct(p.id!)">下架</el-button>
          </div>
        </template>
        <div v-else class="text-sm text-gray-400 py-6 text-center">暂无待审核商品 🎉</div>
      </el-card>

      <!-- 商家待审核队列 -->
      <el-card shadow="never">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-medium">🏪 商家待审核队列</span>
            <router-link to="/admin/merchants">
              <el-button link type="primary">全部 →</el-button>
            </router-link>
          </div>
        </template>

        <template v-if="pendingMerchants.length">
          <div
            v-for="m in pendingMerchants"
            :key="m.id"
            class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
          >
            <div class="flex-1 min-w-0">
              <div class="text-sm text-gray-800 truncate">{{ m.shopName }}</div>
              <div class="text-xs text-gray-400 truncate">{{ m.shopDesc || '暂无简介' }}</div>
            </div>
            <el-button size="small" type="success" @click="approveMerchant(m.id!)">通过</el-button>
            <el-button size="small" type="danger" plain @click="rejectMerchant(m.id!)">拒绝</el-button>
          </div>
        </template>
        <div v-else class="text-sm text-gray-400 py-6 text-center">暂无待审核商家 🎉</div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { db } from '@/db'
import type { Product, Merchant } from '@/db/types'
import { fmtMoney } from '@/utils'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const saleTotal = ref(0)
const orderCount = ref(0)
const onSaleCount = ref(0)
const activeMerchantCount = ref(0)

const pendingProducts = ref<Product[]>([])
const pendingMerchants = ref<Merchant[]>([])

async function load() {
  await userStore.loadAll()

  // 销售总额：累加所有 status != pending 的订单金额
  const orders = await db.orders.toArray()
  saleTotal.value = orders.filter(o => o.status !== 'pending').reduce((s, o) => s + o.totalAmount, 0)
  orderCount.value = orders.length

  onSaleCount.value = await db.products.where('status').equals('on').count()
  activeMerchantCount.value = await db.merchants.where('status').equals('approved').count()

  // 预览队列（前 5 / 前 3）
  const pendingList = await db.products.filter(p => (p.status as string) === 'pending').toArray()
  pendingProducts.value = pendingList.slice(0, 5)
  pendingMerchants.value = (await db.merchants.where('status').equals('pending').toArray()).slice(0, 3)
}

async function approveProduct(id: number) {
  await db.products.update(id, { status: 'on' })
  ElMessage.success('商品已通过审核并上架')
  await load()
}

async function offlineProduct(id: number) {
  await db.products.update(id, { status: 'off' })
  ElMessage.success('商品已下架')
  await load()
}

async function approveMerchant(id: number) {
  await db.merchants.update(id, { status: 'approved' })
  ElMessage.success('商家已通过审核')
  await load()
}

async function rejectMerchant(id: number) {
  await ElMessageBox.confirm('确定拒绝该商家的入驻申请？', '拒绝商家', { type: 'warning' })
  await db.merchants.update(id, { status: 'rejected' })
  ElMessage.success('已拒绝该商家申请')
  await load()
}

onMounted(load)
</script>
