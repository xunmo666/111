<template>
  <div class="p-6">
    <h2 class="text-xl font-bold mb-4">⚙ 系统设置</h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 导出数据 -->
      <el-card shadow="hover">
        <div class="text-3xl mb-2">📤</div>
        <div class="font-medium mb-1">导出数据</div>
        <p class="text-xs text-gray-400 mb-4">
          将所有表（users / merchants / categories / products / orders 等）导出为 JSON 文件下载。
          注意：图片为 Blob 二进制，不会包含在 JSON 中。
        </p>
        <el-button type="primary" :loading="exporting" @click="exportData">导出全部数据</el-button>
      </el-card>

      <!-- 导入数据 -->
      <el-card shadow="hover">
        <div class="text-3xl mb-2">📥</div>
        <div class="font-medium mb-1">导入数据</div>
        <p class="text-xs text-gray-400 mb-4">
          选择此前导出的 JSON 文件，导入前会<b class="text-red-500">清空全部现有数据</b>再批量写入。
        </p>
        <el-button type="warning" :loading="importing" @click="pickFile">选择 JSON 文件导入</el-button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".json"
          class="hidden"
          @change="onFileChange"
        />
      </el-card>

      <!-- 重置全部数据 -->
      <el-card shadow="hover">
        <div class="text-3xl mb-2">🔄</div>
        <div class="font-medium mb-1">重置全部数据</div>
        <p class="text-xs text-gray-400 mb-4">
          清空全部表并重新注入演示 Seed 数据，恢复到初始状态。
        </p>
        <el-button type="danger" :loading="resetting" @click="resetData">重置全部数据</el-button>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { db } from '@/db'
import { resetAllData } from '@/db/seed'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const exporting = ref(false)
const importing = ref(false)
const resetting = ref(false)
const fileInputRef = ref<HTMLInputElement>()

/** 导出 / 导入涉及的表（按外键依赖顺序） */
const TABLE_KEYS = [
  'categories', 'users', 'merchants', 'products', 'cart_items',
  'orders', 'order_items', 'refunds', 'operation_logs'
] as const
type TableKey = typeof TABLE_KEYS[number]

interface DexieTableLike {
  toArray(): Promise<unknown[]>
  clear(): Promise<void>
  bulkAdd(items: unknown[]): Promise<unknown>
}

function table(key: TableKey): DexieTableLike {
  return (db as unknown as Record<TableKey, DexieTableLike>)[key]
}

// ========== 📤 导出 ==========
async function exportData() {
  await ElMessageBox.confirm('将导出所有表数据为 JSON 文件，继续？', '导出数据', { type: 'info' })
  exporting.value = true
  try {
    const data: Record<string, unknown[]> = {}
    for (const key of TABLE_KEYS) {
      data[key] = await table(key).toArray()
    }

    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `second-market-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)

    ElMessage.success('导出成功，文件已开始下载')
  } finally {
    exporting.value = false
  }
}

// ========== 📥 导入 ==========
function pickFile() {
  fileInputRef.value?.click()
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    await ElMessageBox.confirm('导入将清空现有全部数据并覆盖，确定继续？', '导入数据', { type: 'warning' })
  } catch {
    input.value = ''
    return
  }

  importing.value = true
  try {
    let data: Record<string, unknown[]>
    try {
      data = JSON.parse(await file.text())
    } catch {
      ElMessage.error('JSON 解析失败，请检查文件格式')
      return
    }

    for (const key of TABLE_KEYS) {
      if (!Array.isArray(data[key])) {
        ElMessage.error(`文件缺少「${key}」表数据，导入中止`)
        return
      }
    }

    // 清空所有表 → 批量写入
    for (const key of TABLE_KEYS) {
      await table(key).clear()
    }
    for (const key of TABLE_KEYS) {
      const items = data[key]
      if (items.length) await table(key).bulkAdd(items)
    }

    await userStore.loadAll()
    ElMessage.success('导入成功')
  } catch (err) {
    ElMessage.error('导入失败：' + (err as Error).message)
  } finally {
    importing.value = false
    input.value = ''
  }
}

// ========== 🔄 重置 ==========
async function resetData() {
  await ElMessageBox.confirm('将清空全部数据并重新注入演示 Seed 数据，确定？', '重置全部数据', { type: 'warning' })
  resetting.value = true
  try {
    await resetAllData()
    await userStore.loadAll()
    ElMessage.success('已重置为初始演示数据')
  } finally {
    resetting.value = false
  }
}

async function load() {
  await userStore.loadAll()
}

onMounted(load)
</script>
