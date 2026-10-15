<template>
  <div class="max-w-2xl mx-auto px-6 py-8">
    <h2 class="text-xl font-bold mb-6">📝 发布闲置商品</h2>

    <el-card shadow="never">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="例如：高等数学第七版" maxlength="50" show-word-limit />
        </el-form-item>

        <el-form-item label="描述" prop="desc">
          <el-input
            v-model="form.desc"
            type="textarea"
            :rows="4"
            placeholder="成色详情、购买渠道、使用时长、转出原因等"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" />
          <span class="ml-2 text-gray-400 text-sm">元</span>
        </el-form-item>

        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" class="w-full">
            <el-option v-for="c in categories" :key="c.id" :label="`${c.icon} ${c.name}`" :value="c.id!" />
          </el-select>
        </el-form-item>

        <el-form-item label="成色" prop="condition">
          <el-select v-model="form.condition" class="w-full">
            <el-option v-for="c in conditions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>

        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="1" :precision="0" :step="1" />
        </el-form-item>

        <!-- 仅商家角色可见：挂靠到自己的店铺（选填） -->
        <el-form-item v-if="roleStore.isMerchant" label="所属店铺">
          <el-select v-model="form.merchantId" placeholder="不选择则作为个人闲置发布" clearable class="w-full">
            <el-option v-for="m in myMerchants" :key="m.id" :label="m.shopName" :value="m.id!" />
          </el-select>
        </el-form-item>

        <el-form-item label="商品图片">
          <ImageUploader v-model="form.images" :max="6" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="onSubmit">发布商品</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { db } from '@/db'
import type { Category, ProductCondition } from '@/db/types'
import ImageUploader from '@/components/ImageUploader.vue'
import { useRoleStore } from '@/stores/role'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const roleStore = useRoleStore()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const categories = ref<Category[]>([])

const conditions: ProductCondition[] = ['全新', '九成新', '八成新', '七成新', '二手']

const form = reactive({
  title: '',
  desc: '',
  price: 0,
  categoryId: undefined as number | undefined,
  condition: '九成新' as ProductCondition,
  stock: 1,
  merchantId: undefined as number | undefined,
  images: [] as Blob[]
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入商品标题', trigger: 'blur' }],
  desc: [{ required: true, message: '请填写商品描述', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: ['blur', 'change'] }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  condition: [{ required: true, message: '请选择成色', trigger: 'change' }]
}

/** 仅商家角色：当前用户名下的店铺 */
const myMerchants = computed(() =>
  userStore.merchants.filter(m => m.userId === roleStore.currentUserId)
)

async function load() {
  await userStore.loadAll()
  categories.value = await db.categories.toArray()
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await db.products.add({
      title: form.title.trim(),
      desc: form.desc.trim(),
      price: form.price ?? 0,
      condition: form.condition,
      images: form.images,
      categoryId: form.categoryId!,
      userId: roleStore.currentUserId,
      merchantId: roleStore.isMerchant ? (form.merchantId ?? null) : null,
      stock: form.stock,
      status: 'on',
      viewCount: 0,
      createdAt: new Date()
    })
    ElMessage.success('发布成功')
    router.push('/seller/products')
  } finally {
    submitting.value = false
  }
}

function onReset() {
  formRef.value?.resetFields()
  form.images = []
  form.merchantId = undefined
}

onMounted(load)
</script>
