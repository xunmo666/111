<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold">📋 全平台订单</h2>
      <span class="text-xs text-gray-400">只读查询，共 {{ rows.length }} 条</span>
    </div>

    <el-card shadow="never">
      <el-table :data="rows" v-loading="loading">
        <el-table-column label="订单号" prop="order.orderNo" min-width="150" />
        <el-table-column label="买家" width="110" align="center">
          <template #default="{ row }">{{ row.buyerName }}</template>
        </el-table-column>
        <el-table-column label="卖家" width="110" align="center">
          <template #default="{ row }">{{ row.sellerName }}</template>
        </el-table-column>
        <el-table-column label="金额" width="110" align="right">
          <template #default="{ row }">{{ fmtMoney(row.order.totalAmount) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <OrderStatusTag :status="row.order.status" />
          </template>
        </el-table-column>
        <el-table-column label="时间" width="160" align="center">
          <template #default="{ row }">{{ fmtDate(row.order.createdAt) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { db } from '@/db'
import type { Order } from '@/db/types'
import OrderStatusTag from '@/components/OrderStatusTag.vue'
import { fmtDate, fmtMoney } from '@/utils'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const loading = ref(false)

interface OrderRow {
  order: Order
  buyerName: string
  sellerName: string
}
const rows = ref<OrderRow[]>([])

async function load() {
  await userStore.loadAll()
  loading.value = true
  try {
    const list = await db.orders.toArray()
    rows.value = list
      .sort((a, b) => (b.createdAt as any) - (a.createdAt as any))
      .map(o => ({
        order: o,
        buyerName: userStore.users.find(u => u.id === o.userId)?.nickname ?? `用户${o.userId}`,
        sellerName: userStore.users.find(u => u.id === o.sellerId)?.nickname ?? `用户${o.sellerId}`
      }))
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
