<template>
  <div class="max-w-5xl mx-auto px-6 py-6">
    <h2 class="text-xl font-bold mb-4">🏪 商家后台</h2>

    <template v-if="merchant">
      <!-- 待处理提醒 -->
      <el-alert v-if="pendingFaceCount > 0" type="warning" :closable="false" class="mb-4">
        <template #title>
          📢 你有 {{ pendingFaceCount }} 笔订单待面交确认
          <el-button link type="primary" @click="$router.push('/merchant-orders')">去处理 →</el-button>
        </template>
      </el-alert>

      <!-- 数据卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <el-card shadow="hover">
          <div class="text-xs text-gray-400">今日销售额</div>
          <div class="text-2xl font-bold text-red-500 mt-1">{{ fmtMoney(todaySales) }}</div>
          <div class="text-xs text-gray-400 mt-1">当日已付款/已完成合计</div>
        </el-card>

        <el-card shadow="hover">
          <div class="text-xs text-gray-400">本月订单数</div>
          <div class="text-2xl font-bold text-blue-500 mt-1">{{ monthOrderCount }}</div>
        </el-card>

        <el-card shadow="hover">
          <div class="text-xs text-gray-400">在售商品数</div>
          <div class="text-2xl font-bold text-green-500 mt-1">{{ onSaleCount }}</div>
        </el-card>

        <el-card shadow="hover">
          <div class="text-xs text-gray-400">可用余额</div>
          <div class="text-2xl font-bold text-orange-500 mt-1">{{ fmtMoney(balance) }}</div>
        </el-card>
      </div>

      <!-- 快捷入口 -->
      <el-card shadow="never" class="mt-6">
        <template #header><span class="font-medium">⚡ 快捷入口</span></template>
        <div class="flex flex-wrap gap-3">
          <el-button type="primary" plain @click="$router.push('/merchant-products')">🛍️ 商品管理</el-button>
          <el-button type="success" plain @click="$router.push('/merchant-orders')">🧾 订单管理</el-button>
          <el-button type="warning" plain @click="$router.push('/merchant-settings')">⚙ 店铺设置</el-button>
        </div>
      </el-card>
    </template>

    <!-- 还没有商家身份 -->
    <el-card v-else shadow="never">
      <EmptyState text="你还没有商家身份，先去申请入驻吧" emoji="🏬">
        <el-button type="primary" @click="$router.push('/merchant-settings')">去申请</el-button>
      </EmptyState>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { db } from '@/db'
import EmptyState from '@/components/EmptyState.vue'
import { fmtMoney } from '@/utils'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const merchant = computed(() => userStore.currentMerchant)
const balance = computed(() => userStore.currentUser?.balance ?? 0)

const todaySales = ref(0)
const monthOrderCount = ref(0)
const onSaleCount = ref(0)
const pendingFaceCount = ref(0)

async function load() {
  await userStore.loadAll()

  const m = userStore.currentMerchant
  if (!m?.id) return

  const orders = await db.orders.where('merchantId').equals(m.id).toArray()
  const now = new Date()
  const todayStr = now.toDateString()

  // 今日销售额：当日 pay_confirmed + completed 累加
  todaySales.value = orders
    .filter(o =>
      (o.status === 'pay_confirmed' || o.status === 'completed') &&
      new Date(o.createdAt).toDateString() === todayStr
    )
    .reduce((s, o) => s + o.totalAmount, 0)

  // 本月订单数
  monthOrderCount.value = orders.filter(o => {
    const d = new Date(o.createdAt)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length

  // 待面交订单数（待处理提醒）
  pendingFaceCount.value = orders.filter(o => o.status === 'pay_confirmed').length

  // 在售商品数
  onSaleCount.value = await db.products
    .where('merchantId')
    .equals(m.id)
    .and(p => p.status === 'on')
    .count()
}

onMounted(load)
</script>
