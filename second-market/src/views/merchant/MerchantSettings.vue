<template>
  <div class="max-w-2xl mx-auto px-6 py-6">
    <h2 class="text-xl font-bold mb-4">⚙ 店铺设置</h2>

    <el-card shadow="never">
      <!-- 当前状态 -->
      <div v-if="merchant" class="flex items-center gap-2 mb-6">
        <span class="text-sm text-gray-500">当前状态</span>
        <el-tag :type="statusMeta.type" :effect="merchant.status === 'pending' ? 'plain' : 'light'">
          {{ statusMeta.label }}
        </el-tag>
        <span v-if="merchant.status === 'pending'" class="text-xs text-gray-400">
          审核中，管理员通过后即可正式营业
        </span>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="店铺名称" prop="shopName">
          <el-input v-model="form.shopName" maxlength="30" show-word-limit placeholder="例如：王五二手杂货铺" />
        </el-form-item>

        <el-form-item label="店铺简介" prop="shopDesc">
          <el-input
            v-model="form.shopDesc"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="介绍一下你的店铺"
          />
        </el-form-item>

        <el-form-item label="店铺 Logo">
          <ImageUploader v-model="logo" :max="1" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="onSubmit">
            {{ merchant ? '保存修改' : '提交入驻申请' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { db } from '@/db'
import type { MerchantStatus } from '@/db/types'
import ImageUploader from '@/components/ImageUploader.vue'
import { useRoleStore } from '@/stores/role'
import { useUserStore } from '@/stores/user'

const roleStore = useRoleStore()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const saving = ref(false)

const merchant = computed(() => userStore.currentMerchant)

const form = reactive({
  shopName: '',
  shopDesc: ''
})
const logo = ref<Blob[]>([])

const rules: FormRules = {
  shopName: [{ required: true, message: '请输入店铺名称', trigger: 'blur' }],
  shopDesc: [{ required: true, message: '请填写店铺简介', trigger: 'blur' }]
}

const statusMeta = computed<{ label: string; type: 'info' | 'success' | 'danger' | 'warning' }>(() => {
  const map: Record<MerchantStatus, { label: string; type: 'info' | 'success' | 'danger' | 'warning' }> = {
    pending:  { label: '审核中', type: 'info' },
    approved: { label: '已通过', type: 'success' },
    rejected: { label: '已拒绝', type: 'danger' },
    frozen:   { label: '已冻结', type: 'warning' }
  }
  return map[merchant.value?.status ?? 'pending']
})

async function load() {
  await userStore.loadAll()
  const m = userStore.currentMerchant
  form.shopName = m?.shopName ?? ''
  form.shopDesc = m?.shopDesc ?? ''
  logo.value = m?.shopLogo ? [m.shopLogo] : []
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    if (!merchant.value) {
      // 首次申请商家身份 → 写入 merchants 表，等待管理员审核
      await db.merchants.add({
        userId: roleStore.currentUserId,
        shopName: form.shopName.trim(),
        shopDesc: form.shopDesc.trim(),
        shopLogo: logo.value[0],
        status: 'pending',
        totalSales: 0,
        createdAt: new Date()
      })
      ElMessage.success('入驻申请已提交，等待管理员审核')
    } else {
      await db.merchants.update(merchant.value.id!, {
        shopName: form.shopName.trim(),
        shopDesc: form.shopDesc.trim(),
        shopLogo: logo.value[0]
      })
      ElMessage.success('店铺信息已保存')
    }
    await load()
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
