<template>
  <div class="max-w-4xl mx-auto px-6 py-6">
    <h2 class="text-xl font-bold mb-4">📦 我的订单</h2>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="我买的" name="buy" />
      <el-tab-pane label="我卖的" name="sell" />
    </el-tabs>

    <div class="mt-4 flex gap-2">
      <el-tag
        v-for="s in statusList"
        :key="s"
        :type="filter === s ? 'primary' : 'info'"
        effect="plain"
        class="cursor-pointer"
        @click="filter = filter === s ? '' : s"
      >{{ labelOf(s) }}</el-tag>
      <el-tag v-if="!filter" type="primary" effect="dark" class="cursor-pointer" @click="filter = ''">全部</el-tag>
    </div>

    <div class="mt-6 space-y-3">
      <template v-if="filteredOrders.length">
        <el-card v-for="o in filteredOrders" :key="o.id" shadow="hover">
          <div class="flex items-center justify-between text-xs text-gray-400">
            <span>订单号 {{ o.orderNo }}</span>
            <span>{{ formatDate(o.createdAt) }}</span>
          </div>

          <div class="mt-3">
            <el-table :data="getItems(o.id!)" size="small" border>
              <el-table-column label="商品" min-width="180">
                <template #default="{ row }">
                  <div class="text-sm font-medium">{{ row.productSnapshot.title }}</div>
                  <div class="text-xs text-gray-400">× {{ row.quantity }}</div>
                </template>
              </el-table-column>
              <el-table-column label="价格" width="100" align="center">
                <template #default="{ row }">¥{{ row.priceAtBuy }}</template>
              </el-table-column>
            </el-table>
          </div>

          <div class="mt-3 flex items-center justify-between">
            <div class="text-sm">
              合计 <span class="text-red-500 font-bold text-lg">¥{{ o.totalAmount }}</span>
              <el-tag class="ml-3" :type="tagType(o.status)" effect="light">{{ labelOf(o.status) }}</el-tag>
            </div>
            <div class="flex gap-2">
              <el-button
                v-if="o.status === 'pay_confirmed' && activeTab === 'sell'"
                type="success"
                size="small"
                @click="confirmFace(o.id!)"
              >✓ 确认面交完成</el-button>

              <el-button
                v-if="o.status === 'pending' && activeTab === 'buy'"
                type="danger"
                size="small"
                @click="cancelOrder(o.id!)"
              >取消订单</el-button>

              <el-button
                v-if="o.status === 'completed' && activeTab === 'buy'"
                size="small"
                @click="applyRefund(o.id!, '仅退款')"
              >申请退款</el-button>
            </div>
          </div>

          <div class="mt-2 text-xs text-gray-500">
            📍 {{ o.faceMeetLocation }} · 🕐 {{ o.faceMeetTime }}
          </div>
        </el-card>
      </template>
      <EmptyState v-else text="暂无订单" emoji="📭" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { db } from '@/db'
import type { Order, OrderStatus, OrderItem } from '@/db/types'
import EmptyState from '@/components/EmptyState.vue'
import { fmtDate } from '@/utils'
import { useRoleStore } from '@/stores/role'
import { useUserStore } from '@/stores/user'

const roleStore = useRoleStore()
const userStore = useUserStore()

const activeTab = ref<'buy' | 'sell'>('buy')
const filter = ref<string>('')
const orders = ref<Order[]>([])
const itemsMap = ref<Map<number, OrderItem[]>>(new Map())

const statusList: OrderStatus[] = ['pending', 'pay_confirmed', 'completed', 'cancelled']

function labelOf(s: string) {
  const map: Record<string, string> = {
    pending: '待付款', pay_confirmed: '待面交', completed: '已完成',
    cancelled: '已取消', refund_pending: '退款中', refunded: '已退款'
  }
  return map[s] ?? s
}
function tagType(s: string) {
  const map: Record<string, string> = { pending: 'warning', pay_confirmed: 'info', completed: 'success', cancelled: 'info', refund_pending: 'warning', refunded: 'danger' }
  return map[s] ?? ''
}

function formatDate(d: Date | string) { return fmtDate(d) }

function getItems(orderId: number) { return itemsMap.value.get(orderId) ?? [] }

async function load() {
  const uid = roleStore.currentUserId
  await userStore.loadAll()

  let os: Order[] = []
  if (activeTab.value === 'buy') {
    os = await db.orders.where('userId').equals(uid).toArray()
  } else {
    os = await db.orders.where('sellerId').equals(uid).toArray()
  }
  orders.value = os.sort((a, b) => (b.createdAt as any) - (a.createdAt as any))

  // 加载所有 order_items
  const newMap = new Map<number, OrderItem[]>()
  for (const o of os) {
    const its = await db.order_items.where('orderId').equals(o.id!).toArray()
    newMap.set(o.id!, its)
  }
  itemsMap.value = newMap
}

const filteredOrders = computed(() =>
  filter.value ? orders.value.filter(o => o.status === filter.value) : orders.value
)

async function confirmFace(orderId: number) {
  await ElMessageBox.confirm('确认买家已完成面交？卖家将收到款项', '面交确认')
  const o = await db.orders.get(orderId)
  if (!o) return
  await db.orders.update(orderId, { status: 'completed', shippingStatus: 'face_confirmed' })
  // 卖家余额到账
  await db.users.update(o.sellerId, { balance: (await db.users.get(o.sellerId))!.balance + o.totalAmount })
  await userStore.loadAll()
  ElMessage.success('交易完成，卖家已到账')
  await load()
}

async function cancelOrder(orderId: number) {
  await ElMessageBox.confirm('确定取消此订单？', '取消订单', { type: 'warning' })
  await db.orders.update(orderId, { status: 'cancelled' })
  ElMessage.info('订单已取消')
  await load()
}

async function applyRefund(orderId: number, _type: string) {
  const { value: reason } = await ElMessageBox.prompt('请输入退款原因', '申请退款')
  if (!reason) return
  await db.refunds.add({ orderId, userId: roleStore.currentUserId, reason, type: 'refund_only', status: 'pending', createdAt: new Date() })
  await db.orders.update(orderId, { status: 'refund_pending' })
  ElMessage.success('退款申请已提交')
  await load()
}

onMounted(load)
</script>
