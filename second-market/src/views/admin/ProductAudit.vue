<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold">✅ 商品审核</h2>
      <span class="text-xs text-gray-400">全部 C2C 个人闲置商品（不含店铺商品）</span>
    </div>

    <el-card shadow="never">
      <el-table :data="rows" v-loading="loading">
        <el-table-column label="商品" min-width="260">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                <img v-if="row.imgUrl" :src="row.imgUrl" class="w-full h-full object-cover" />
                <span v-else class="text-gray-300 text-xs">无图</span>
              </div>
              <span class="text-sm text-gray-800 truncate">{{ row.product.title }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="价格" width="110" align="center">
          <template #default="{ row }">{{ fmtMoney(row.product.price) }}</template>
        </el-table-column>

        <el-table-column label="成色" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ row.product.condition }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="发布者" width="120" align="center">
          <template #default="{ row }">{{ row.publisher }}</template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagType[row.product.status as ProductStatus]">
              {{ statusLabel[row.product.status as ProductStatus] ?? row.product.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="170" align="center">
          <template #default="{ row }">
            <el-button
              size="small"
              type="success"
              :disabled="row.product.status === 'on'"
              @click="setStatus(row.product, 'on', '已通过并上架')"
            >通过</el-button>
            <el-button
              size="small"
              type="warning"
              plain
              :disabled="row.product.status === 'off'"
              @click="setStatus(row.product, 'off', '已下架')"
            >下架</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { db } from '@/db'
import type { Product, ProductStatus } from '@/db/types'
import { fmtMoney } from '@/utils'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const loading = ref(false)

interface AuditRow {
  product: Product
  publisher: string
  imgUrl: string
}
const rows = ref<AuditRow[]>([])

const statusLabel: Record<ProductStatus, string> = { on: '在售', off: '下架', sold: '售罄' }
const statusTagType: Record<ProductStatus, 'success' | 'info' | 'warning'> = { on: 'success', off: 'info', sold: 'warning' }

function revokeUrls() {
  rows.value.forEach(r => r.imgUrl && URL.revokeObjectURL(r.imgUrl))
}

async function load() {
  await userStore.loadAll()
  loading.value = true
  try {
    revokeUrls()
    // 全部 C2C 商品（merchantId 为空）
    const list = (await db.products.filter(p => p.merchantId == null).toArray())
      .sort((a, b) => (b.createdAt as any) - (a.createdAt as any))

    rows.value = list.map(p => ({
      product: p,
      publisher: userStore.users.find(u => u.id === p.userId)?.nickname ?? '未知用户',
      imgUrl: p.images?.[0] ? URL.createObjectURL(p.images[0]) : ''
    }))
  } finally {
    loading.value = false
  }
}

async function setStatus(p: Product, status: ProductStatus, msg: string) {
  await db.products.update(p.id!, { status })
  ElMessage.success(`「${p.title}」${msg}`)
  await load()
}

onMounted(load)
onBeforeUnmount(revokeUrls)
</script>
