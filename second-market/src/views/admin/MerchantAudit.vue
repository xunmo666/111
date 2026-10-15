<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold">🏪 商家审核</h2>
      <span class="text-xs text-gray-400">status = pending 的入驻申请</span>
    </div>

    <el-card shadow="never">
      <el-table v-if="rows.length" :data="rows">
        <el-table-column label="店铺名称" prop="merchant.shopName" min-width="160" />
        <el-table-column label="店主" width="110" align="center">
          <template #default="{ row }">{{ row.ownerName }}</template>
        </el-table-column>
        <el-table-column label="店铺简介" min-width="200">
          <template #default="{ row }">
            <span class="text-gray-500 text-sm">{{ row.merchant.shopDesc || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="160" align="center">
          <template #default="{ row }">{{ fmtDate(row.merchant.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="approve(row.merchant)">通过</el-button>
            <el-button size="small" type="danger" plain @click="reject(row.merchant)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-else class="text-sm text-gray-400 py-10 text-center">暂无待审核商家 🎉</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { db } from '@/db'
import type { Merchant } from '@/db/types'
import { fmtDate } from '@/utils'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

interface AuditRow {
  merchant: Merchant
  ownerName: string
}
const rows = ref<AuditRow[]>([])

async function load() {
  await userStore.loadAll()

  const pending = await db.merchants.where('status').equals('pending').toArray()
  rows.value = pending
    .sort((a, b) => (b.createdAt as any) - (a.createdAt as any))
    .map(m => ({
      merchant: m,
      ownerName: userStore.users.find(u => u.id === m.userId)?.nickname ?? '未知用户'
    }))
}

async function approve(m: Merchant) {
  await db.merchants.update(m.id!, { status: 'approved' })
  ElMessage.success(`「${m.shopName}」已通过审核`)
  await load()
}

async function reject(m: Merchant) {
  await ElMessageBox.confirm(`确定拒绝「${m.shopName}」的入驻申请？`, '拒绝商家', { type: 'warning' })
  await db.merchants.update(m.id!, { status: 'rejected' })
  ElMessage.success(`已拒绝「${m.shopName}」的申请`)
  await load()
}

onMounted(load)
</script>
