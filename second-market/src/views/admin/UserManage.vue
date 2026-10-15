<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold">👥 用户管理</h2>
      <span class="text-xs text-gray-400">禁用用户将使其风险等级 +1</span>
    </div>

    <el-card shadow="never">
      <el-table :data="userStore.users" v-loading="userStore.loading">
        <el-table-column label="ID" prop="id" width="60" />
        <el-table-column label="昵称" prop="nickname" min-width="110" />
        <el-table-column label="角色" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="roleTagType[row.role as RoleType]">{{ roleLabel[row.role as RoleType] ?? row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="联系方式" prop="contact" min-width="130" />
        <el-table-column label="学院" prop="college" min-width="120" />
        <el-table-column label="余额" width="110" align="right">
          <template #default="{ row }">{{ fmtMoney(row.balance) }}</template>
        </el-table-column>
        <el-table-column label="风险等级" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.riskLevel > 0" size="small" type="danger">{{ row.riskLevel }}</el-tag>
            <span v-else class="text-gray-300">0</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.riskLevel > 0" size="small" type="danger">已禁用</el-tag>
            <el-tag v-else size="small" type="success">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.riskLevel > 0"
              size="small"
              type="success"
              plain
              @click="enableUser(row)"
            >启用</el-button>
            <el-button
              v-else
              size="small"
              type="danger"
              plain
              @click="disableUser(row)"
            >禁用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { db } from '@/db'
import type { User, RoleType } from '@/db/types'
import { fmtMoney } from '@/utils'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const roleLabel: Record<RoleType, string> = {
  buyer: '买家', seller: '卖家', merchant: '商家', admin: '管理员'
}
const roleTagType: Record<RoleType, '' | 'success' | 'warning' | 'danger' | 'info'> = {
  buyer: '', seller: 'success', merchant: 'warning', admin: 'danger'
}

async function load() {
  await userStore.loadAll()
}

/** 禁用：riskLevel + 1 */
async function disableUser(u: User) {
  await ElMessageBox.confirm(
    `确定禁用「${u.nickname}」？其风险等级将 +1（当前 ${u.riskLevel}）`,
    '禁用用户',
    { type: 'warning' }
  )
  await db.users.update(u.id!, { riskLevel: u.riskLevel + 1 })
  ElMessage.success(`已禁用「${u.nickname}」，风险等级变为 ${u.riskLevel + 1}`)
  await load()
}

/** 启用：riskLevel 归零 */
async function enableUser(u: User) {
  await db.users.update(u.id!, { riskLevel: 0 })
  ElMessage.success(`已启用「${u.nickname}」`)
  await load()
}

onMounted(load)
</script>
