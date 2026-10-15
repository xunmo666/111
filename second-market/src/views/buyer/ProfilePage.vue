<template>
  <div class="max-w-4xl mx-auto px-6 py-6 space-y-6">
    <h2 class="text-xl font-bold">👤 用户中心</h2>

    <!-- 基本信息 -->
    <el-card shadow="never">
      <div class="flex items-center gap-5">
        <!-- 头像占位 -->
        <div class="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl font-bold shrink-0">
          {{ (user?.nickname ?? '？').slice(0, 1) }}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-lg font-bold">{{ user?.nickname ?? '未选择视角用户' }}</span>
            <el-tag
              size="small"
              effect="dark"
              :color="roleStore.roleColor"
              style="border: none;"
            >{{ roleStore.roleLabel }}</el-tag>
          </div>
          <div class="mt-1 text-sm text-gray-500 space-x-4">
            <span>📬 {{ user?.contact || '—' }}</span>
            <span>🎓 {{ user?.college || '—' }}</span>
          </div>
        </div>

        <div class="text-right shrink-0">
          <div class="text-xs text-gray-400">余额</div>
          <div class="text-2xl font-bold text-red-500">{{ fmtMoney(user?.balance ?? 0) }}</div>
        </div>

        <el-button type="primary" plain @click="openProfileEdit">编辑资料</el-button>
      </div>
    </el-card>

    <!-- 快捷入口 -->
    <el-card shadow="never">
      <template #header><span class="font-medium">⚡ 快捷入口</span></template>
      <div class="flex flex-wrap gap-3">
        <el-button @click="$router.push('/seller/products')">📝 我的发布</el-button>
        <el-button @click="$router.push('/orders')">📦 我的订单</el-button>
        <el-button @click="$router.push('/cart')">🛒 购物车</el-button>
        <el-button v-if="roleStore.isAdmin" type="danger" plain @click="onResetData">🔄 重置数据</el-button>
      </div>
    </el-card>

    <!-- 收货地址 -->
    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">📍 收货地址</span>
          <el-button type="primary" size="small" @click="openAddrDialog()">新增地址</el-button>
        </div>
      </template>

      <el-table v-if="addresses.length" :data="addresses" size="small">
        <el-table-column label="收件人" prop="name" width="110" />
        <el-table-column label="电话" prop="phone" width="140" />
        <el-table-column label="详细地址" prop="detail" min-width="180" />
        <el-table-column label="默认" width="70" align="center">
          <template #default="{ $index }">
            <el-tag v-if="addresses[$index].isDefault" type="success" size="small">默认</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ $index }">
            <el-button size="small" @click="openAddrDialog($index)">编辑</el-button>
            <el-button size="small" type="danger" plain @click="removeAddress($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="text-sm text-gray-400 py-4 text-center">暂无收货地址，点击右上角新增</div>
    </el-card>

    <!-- 编辑资料弹窗 -->
    <el-dialog v-model="profileVisible" title="编辑资料" width="440px">
      <el-form ref="profileRef" :model="profileForm" label-width="80px">
        <el-form-item label="昵称" prop="nickname" :rules="[{ required: true, message: '请输入昵称', trigger: 'blur' }]">
          <el-input v-model="profileForm.nickname" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="联系方式" prop="contact" :rules="[{ required: true, message: '请输入联系方式', trigger: 'blur' }]">
          <el-input v-model="profileForm.contact" placeholder="微信 / QQ / 手机号" />
        </el-form-item>
        <el-form-item label="学院" prop="college" :rules="[{ required: true, message: '请输入学院', trigger: 'blur' }]">
          <el-input v-model="profileForm.college" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="profileVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑地址弹窗 -->
    <el-dialog v-model="addrVisible" :title="editingIndex === null ? '新增地址' : '编辑地址'" width="440px">
      <el-form ref="addrRef" :model="addrForm" label-width="80px">
        <el-form-item label="收件人" prop="name" :rules="[{ required: true, message: '请输入收件人', trigger: 'blur' }]">
          <el-input v-model="addrForm.name" />
        </el-form-item>
        <el-form-item label="电话" prop="phone" :rules="[{ required: true, message: '请输入电话', trigger: 'blur' }]">
          <el-input v-model="addrForm.phone" />
        </el-form-item>
        <el-form-item label="详细地址" prop="detail" :rules="[{ required: true, message: '请输入详细地址', trigger: 'blur' }]">
          <el-input v-model="addrForm.detail" placeholder="例如：1号楼302" />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="addrForm.isDefault" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addrVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAddress">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { db } from '@/db'
import type { Address } from '@/db/types'
import { resetAllData } from '@/db/seed'
import { fmtMoney } from '@/utils'
import { useRoleStore } from '@/stores/role'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const roleStore = useRoleStore()
const userStore = useUserStore()

const user = computed(() => userStore.currentUser)
const addresses = computed<Address[]>(() => user.value?.addresses ?? [])

// ========== 编辑资料 ==========
const profileVisible = ref(false)
const profileRef = ref<FormInstance>()
const profileForm = reactive({ nickname: '', contact: '', college: '' })

function openProfileEdit() {
  if (!user.value) return
  profileForm.nickname = user.value.nickname
  profileForm.contact = user.value.contact
  profileForm.college = user.value.college
  profileVisible.value = true
}

async function saveProfile() {
  const valid = await profileRef.value?.validate().catch(() => false)
  if (!valid || !user.value?.id) return
  await db.users.update(user.value.id, {
    nickname: profileForm.nickname.trim(),
    contact: profileForm.contact.trim(),
    college: profileForm.college.trim()
  })
  await userStore.loadAll()
  profileVisible.value = false
  ElMessage.success('资料已更新')
}

// ========== 收货地址增删改 ==========
const addrVisible = ref(false)
const addrRef = ref<FormInstance>()
const editingIndex = ref<number | null>(null)
const addrForm = reactive({ name: '', phone: '', detail: '', isDefault: false })

function openAddrDialog(index?: number) {
  editingIndex.value = index ?? null
  const a = index !== undefined ? addresses.value[index] : null
  addrForm.name = a?.name ?? ''
  addrForm.phone = a?.phone ?? ''
  addrForm.detail = a?.detail ?? ''
  addrForm.isDefault = a?.isDefault ?? false
  addrVisible.value = true
}

async function saveAddress() {
  const valid = await addrRef.value?.validate().catch(() => false)
  if (!valid) return

  const list = addresses.value.map(a => ({ ...a }))
  const entry = {
    name: addrForm.name.trim(),
    phone: addrForm.phone.trim(),
    detail: addrForm.detail.trim(),
    isDefault: addrForm.isDefault
  }
  if (entry.isDefault) list.forEach(a => { a.isDefault = false })

  if (editingIndex.value === null) {
    list.push({ ...entry, id: Date.now() })
  } else {
    list[editingIndex.value] = { ...list[editingIndex.value], ...entry }
  }
  await persistAddresses(list)
  addrVisible.value = false
}

async function removeAddress(index: number) {
  await ElMessageBox.confirm('确定删除该收货地址？', '删除地址', { type: 'warning' })
  await persistAddresses(addresses.value.filter((_, i) => i !== index))
}

/** 整体写回 user.addresses */
async function persistAddresses(list: Address[]) {
  if (!user.value?.id) return
  await db.users.update(user.value.id, { addresses: list })
  await userStore.loadAll()
  ElMessage.success('地址已保存')
}

// ========== 重置数据（仅管理员） ==========
async function onResetData() {
  await ElMessageBox.confirm('将清空全部数据并重新注入演示数据，确定？', '重置数据', { type: 'warning' })
  await resetAllData()
  await userStore.loadAll()
  ElMessage.success('数据已重置')
  router.push('/')
}

async function load() {
  await userStore.loadAll()
}

onMounted(load)
</script>
