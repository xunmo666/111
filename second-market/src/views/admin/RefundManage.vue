<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold">⚠ 售后工单</h2>
      <span class="text-xs text-gray-400">通过后将退款给买家并从卖家余额扣款</span>
    </div>

    <el-card shadow="never">
      <el-table :data="rows" v-loading="loading">
        <el-table-column label="订单号" width="150">
          <template #default="{ row }">{{ row.orderNo }}</template>
        </el-table-column>
        <el-table-column label="申请人" width="110" align="center">
          <template #default="{ row }">{{ row.applicant }}</template>
        </el-table-column>
        <el-table-column label="原因" min-width="180">
          <template #default="{ row }">
            <span class="text-sm text-gray-600">{{ row.refund.reason }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ typeLabel[row.refund.type as RefundType] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="statusMeta[row.refund.status as RefundStatus].type">
              {{ statusMeta[row.refund.status as RefundStatus].label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="160" align="center">
          <template #default="{ row }">{{ fmtDate(row.refund.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="170" align="center">
          <template #default="{ row }">
            <template v-if="row.refund.status === 'pending'">
              <el-button size="small" type="success" @click="approve(row.refund)">通过</el-button>
              <el-button size="small" type="danger" plain @click="reject(row.refund)">拒绝</el-button>
            </template>
            <span v-else-if="row.refund.reviewNote" class="text-xs text-gray-400">
              处理意见：{{ row.refund.reviewNote }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { db } from '@/db'
import type { Order, Refund, RefundType, RefundStatus } from '@/db/types'
import { fmtDate, fmtMoney } from '@/utils'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const loading = ref(false)

interface RefundRow {
  refund: Refund
  orderNo: string
  applicant: string
}
const rows = ref<RefundRow[]>([])

const typeLabel: Record<RefundType, string> = {
  refund_only: '仅退款',
  refund_return: '退货退款'
}

const statusMeta: Record<RefundStatus, { label: string; type: 'warning' | 'success' | 'danger' }> = {
  pending:  { label: '待处理', type: 'warning' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已拒绝', type: 'danger' }
}

async function load() {
  await userStore.loadAll()
  loading.value = true
  try {
    const list = await db.refunds.toArray()
    rows.value = list
      .sort((a, b) => (b.createdAt as any) - (a.createdAt as any))
      .map(r => {
        const order = orderMap.value.get(r.orderId)
        return {
          refund: r,
          orderNo: order?.orderNo ?? `订单#${r.orderId}`,
          applicant: userStore.users.find(u => u.id === r.userId)?.nickname ?? `用户${r.userId}`
        }
      })
  } finally {
    loading.value = false
  }
}

/** orderId → Order 缓存 */
const orderMap = ref<Map<number, Order>>(new Map())

async function buildOrderMap() {
  const m = new Map<number, Order>()
  for (const o of await db.orders.toArray()) {
    if (o.id != null) m.set(o.id, o)
  }
  orderMap.value = m
}

/**
 * 通过售后：refunds.status=approved
 *   + orders.status=refunded
 *   + credit 买家余额（退款金额）
 *   + debit 卖家余额（退款金额）
 */
async function adminApproveRefund(r: Refund) {
  const order = await db.orders.get(r.orderId)
  if (!order) {
    ElMessage.error('未找到对应订单，无法处理')
    return
  }

  await db.refunds.update(r.id!, { status: 'approved' })
  await db.orders.update(order.id!, { status: 'refunded' })
  await userStore.credit(r.userId, order.totalAmount, '售后退款')
  const debitOk = await userStore.debit(order.sellerId, order.totalAmount, '售后退款扣款')

  if (debitOk) {
    ElMessage.success(`已通过：退款 ${fmtMoney(order.totalAmount)} 已退给买家、已从卖家余额扣款`)
  } else {
    ElMessage.warning(`已通过，但卖家余额不足，扣款 ${fmtMoney(order.totalAmount)} 未完成`)
  }
  await load()
}

async function approve(r: Refund) {
  const order = orderMap.value.get(r.orderId)
  const amount = order?.totalAmount ?? 0
  await ElMessageBox.confirm(
    `确定通过该售后？将退款 ${fmtMoney(amount)} 给买家，并从卖家余额扣款 ${fmtMoney(amount)}`,
    '通过退款',
    { type: 'warning' }
  )
  await adminApproveRefund(r)
}

/** 拒绝：填写理由，订单从「退款中」恢复为「已完成」 */
async function reject(r: Refund) {
  const { value } = await ElMessageBox.prompt('请输入拒绝理由', '拒绝退款', {
    inputValidator: (v: string) => (v && v.trim() ? true : '理由不能为空')
  })
  const reason = value.trim()

  await db.refunds.update(r.id!, { status: 'rejected', reviewNote: reason })

  // 订单此前为 refund_pending，拒绝后恢复为已完成
  const order = await db.orders.get(r.orderId)
  if (order && order.status === 'refund_pending') {
    await db.orders.update(order.id!, { status: 'completed' })
  }

  ElMessage.success('已拒绝该售后申请')
  await load()
}

onMounted(async () => {
  await buildOrderMap()
  await load()
})
</script>
