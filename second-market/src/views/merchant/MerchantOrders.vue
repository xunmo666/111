<template>
  <div class="max-w-4xl mx-auto px-6 py-6">
    <h2 class="text-xl font-bold mb-4">🧾 店铺订单管理</h2>

    <!-- 还没有商家身份 -->
    <el-card v-if="!merchant" shadow="never">
      <EmptyState text="你还没有商家身份，先去申请入驻吧" emoji="🏬">
        <el-button type="primary" @click="$router.push('/merchant-settings')">去申请</el-button>
      </EmptyState>
    </el-card>

    <div v-else class="space-y-3">
      <template v-if="orders.length">
        <el-card v-for="o in orders" :key="o.id" shadow="hover">
          <div class="flex items-center justify-between text-xs text-gray-400">
            <span>订单号 {{ o.orderNo }}</span>
            <span>{{ fmtDate(o.createdAt) }}</span>
          </div>

          <div class="mt-3">
            <el-table :data="getItems(o.id!)" size="small" border>
              <el-table-column label="商品" min-width="180">
                <template #default="{ row }">
                  <div class="text-sm font-medium">{{ row.productSnapshot.title }}</div>
                  <div class="text-xs text-gray-400">× {{ row.quantity }}</div>
                </template>
              </el-table-column>
              <el-table-column label="成交价" width="110" align="center">
                <template #default="{ row }">{{ fmtMoney(row.priceAtBuy) }}</template>
              </el-table-column>
            </el-table>
          </div>

          <div class="mt-3 flex items-center justify-between">
            <div class="text-sm">
              收款 <span class="text-red-500 font-bold text-lg">{{ fmtMoney(o.totalAmount) }}</span>
              <OrderStatusTag class="ml-3" :status="o.status" />
            </div>
            <el-button
              v-if="o.status === 'pay_confirmed'"
              type="success"
              size="small"
              @click="confirmFace(o.id!)"
            >✓ 确认面交完成</el-button>
          </div>

          <div class="mt-2 text-xs text-gray-500">
            📍 {{ o.faceMeetLocation }} · 🕐 {{ o.faceMeetTime }}
            <span v-if="o.remark" class="ml-2">💬 {{ o.remark }}</span>
          </div>
        </el-card>
      </template>
      <EmptyState v-else text="暂无店铺订单" emoji="🧾" />
    </div>
  </div>
</template>

<script setup lang="ts">
// 店铺订单：与卖家订单类似，但按 merchantId = 当前商家 过滤，只显示 待面交 + 已完成
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { db } from '@/db'
import type { Order, OrderItem } from '@/db/types'
import OrderStatusTag from '@/components/OrderStatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { fmtDate, fmtMoney } from '@/utils'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const merchant = computed(() => userStore.currentMerchant)

const orders = ref<Order[]>([])
const itemsMap = ref<Map<number, OrderItem[]>>(new Map())

function getItems(orderId: number) {
  return itemsMap.value.get(orderId) ?? []
}

async function load() {
  await userStore.loadAll()

  const m = userStore.currentMerchant
  if (!m?.id) {
    orders.value = []
    return
  }

  const list = await db.orders.where('merchantId').equals(m.id).toArray()
  orders.value = list
    .filter(o => o.status === 'pay_confirmed' || o.status === 'completed')
    .sort((a, b) => (b.createdAt as any) - (a.createdAt as any))

  const map = new Map<number, OrderItem[]>()
  for (const o of orders.value) {
    map.set(o.id!, await db.order_items.where('orderId').equals(o.id!).toArray())
  }
  itemsMap.value = map
}

async function confirmFace(orderId: number) {
  await ElMessageBox.confirm('确认买家已完成面交？货款将进入店铺账户余额', '确认面交', { type: 'warning' })
  const o = await db.orders.get(orderId)
  if (!o) return
  await db.orders.update(orderId, { status: 'completed', shippingStatus: 'face_confirmed' })
  // 卖家（商家账号）余额到账
  await userStore.credit(o.sellerId, o.totalAmount, '店铺面交完成收款')
  ElMessage.success('交易完成，货款已到账')
  await load()
}

onMounted(load)
</script>
