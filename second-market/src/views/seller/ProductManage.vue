<template>
  <div class="max-w-4xl mx-auto px-6 py-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold">📦 我发布的商品</h2>
      <el-button type="primary" @click="$router.push('/publish')">＋ 发布新品</el-button>
    </div>

    <!-- 状态过滤 Tab -->
    <el-tabs v-model="activeTab">
      <el-tab-pane v-for="t in tabs" :key="t.value" :label="t.label" :name="t.value" />
    </el-tabs>

    <div class="mt-4 space-y-3">
      <template v-if="filtered.length">
        <el-card v-for="p in filtered" :key="p.id" shadow="hover">
          <div class="flex items-center gap-4">
            <!-- 图 -->
            <div class="w-20 h-20 rounded-md bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
              <img v-if="imgUrls.get(p.id!)" :src="imgUrls.get(p.id!)" class="w-full h-full object-cover" />
              <span v-else class="text-gray-300 text-xs">无图</span>
            </div>

            <!-- 标题 + 价格 + 成色 + 浏览量 -->
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-800 truncate">{{ p.title }}</div>
              <div class="mt-1 flex items-baseline gap-2 flex-wrap">
                <span class="text-red-500 font-bold text-lg">{{ fmtMoney(p.price) }}</span>
                <el-tag size="small" type="info" effect="plain">{{ p.condition }}</el-tag>
                <el-tag size="small" :type="statusTagType[p.status]">{{ statusLabel[p.status] }}</el-tag>
              </div>
              <div class="mt-1 text-xs text-gray-400">👁 浏览 {{ p.viewCount }} · 库存 {{ p.stock }}</div>
            </div>

            <!-- 操作 -->
            <div class="flex flex-col gap-2 shrink-0 w-24">
              <el-button v-if="p.status === 'on'" size="small" @click="toggleStatus(p, 'off')">下架</el-button>
              <el-button v-else-if="p.status === 'off'" size="small" type="success" @click="toggleStatus(p, 'on')">上架</el-button>
              <el-button size="small" @click="openEdit(p)">编辑</el-button>
              <el-tooltip content="该商品有进行中的订单，暂不能删除" :disabled="!lockedIds.has(p.id!)" placement="left">
                <span>
                  <el-button
                    size="small"
                    type="danger"
                    plain
                    class="w-full"
                    :disabled="lockedIds.has(p.id!)"
                    @click="removeProduct(p)"
                  >删除</el-button>
                </span>
              </el-tooltip>
            </div>
          </div>
        </el-card>
      </template>
      <EmptyState v-else text="暂无相关商品" emoji="🗂️" />
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editVisible" title="编辑商品" width="520px">
      <el-form ref="editRef" :model="editForm" label-width="80px">
        <el-form-item label="标题" prop="title" :rules="[{ required: true, message: '请输入标题', trigger: 'blur' }]">
          <el-input v-model="editForm.title" maxlength="50" />
        </el-form-item>
        <el-form-item label="描述" prop="desc" :rules="[{ required: true, message: '请输入描述', trigger: 'blur' }]">
          <el-input v-model="editForm.desc" type="textarea" :rows="3" maxlength="500" />
        </el-form-item>
        <el-form-item label="价格" prop="price" :rules="[{ required: true, message: '请输入价格', trigger: ['blur', 'change'] }]">
          <el-input-number v-model="editForm.price" :min="0" :precision="2" :step="1" />
          <span class="ml-2 text-gray-400 text-sm">元</span>
        </el-form-item>
        <el-form-item label="分类" prop="categoryId" :rules="[{ required: true, message: '请选择分类', trigger: 'change' }]">
          <el-select v-model="editForm.categoryId" class="w-full">
            <el-option v-for="c in categories" :key="c.id" :label="`${c.icon} ${c.name}`" :value="c.id!" />
          </el-select>
        </el-form-item>
        <el-form-item label="成色" prop="condition" :rules="[{ required: true, message: '请选择成色', trigger: 'change' }]">
          <el-select v-model="editForm.condition">
            <el-option v-for="c in conditions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="editForm.stock" :min="1" :precision="0" :step="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { db } from '@/db'
import type { Product, ProductStatus, Category, ProductCondition } from '@/db/types'
import EmptyState from '@/components/EmptyState.vue'
import { fmtMoney } from '@/utils'
import { useRoleStore } from '@/stores/role'
import { useUserStore } from '@/stores/user'

const roleStore = useRoleStore()
const userStore = useUserStore()

const activeTab = ref<ProductStatus | ''>('')
const tabs: { label: string; value: ProductStatus | '' }[] = [
  { label: '全部', value: '' },
  { label: '在售', value: 'on' },
  { label: '下架', value: 'off' },
  { label: '售罄', value: 'sold' }
]

const statusLabel: Record<ProductStatus, string> = { on: '在售', off: '下架', sold: '售罄' }
const statusTagType: Record<ProductStatus, 'success' | 'info' | 'warning'> = { on: 'success', off: 'info', sold: 'warning' }
const conditions: ProductCondition[] = ['全新', '九成新', '八成新', '七成新', '二手']

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
/** 有进行中订单的商品 id，删除按钮禁用 */
const lockedIds = ref<Set<number>>(new Set())
const imgUrls = ref<Map<number, string>>(new Map())

const filtered = computed(() =>
  activeTab.value ? products.value.filter(p => p.status === activeTab.value) : products.value
)

function rebuildUrls(list: Product[]) {
  imgUrls.value.forEach(u => URL.revokeObjectURL(u))
  const m = new Map<number, string>()
  for (const p of list) {
    if (p.images?.[0]) m.set(p.id!, URL.createObjectURL(p.images[0]))
  }
  imgUrls.value = m
}

async function load() {
  await userStore.loadAll()

  const uid = roleStore.currentUserId
  const list = await db.products.where('userId').equals(uid).toArray()
  products.value = list.sort((a, b) => (b.createdAt as any) - (a.createdAt as any))
  rebuildUrls(list)
  categories.value = await db.categories.toArray()

  // 删除保护：存在 待付款/待面交/退款中 订单的商品不可删除
  const [items, orders] = await Promise.all([db.order_items.toArray(), db.orders.toArray()])
  const activeOrderIds = new Set(
    orders
      .filter(o => o.status === 'pending' || o.status === 'pay_confirmed' || o.status === 'refund_pending')
      .map(o => o.id!)
  )
  lockedIds.value = new Set(items.filter(it => activeOrderIds.has(it.orderId)).map(it => it.productId))
}

async function toggleStatus(p: Product, status: ProductStatus) {
  await db.products.update(p.id!, { status })
  ElMessage.success(status === 'on' ? '已上架' : '已下架')
  await load()
}

async function removeProduct(p: Product) {
  await ElMessageBox.confirm(`确定删除「${p.title}」？删除后不可恢复`, '删除商品', { type: 'warning' })
  await db.products.delete(p.id!)
  ElMessage.success('已删除')
  await load()
}

// ========== 编辑弹窗 ==========
const editVisible = ref(false)
const editRef = ref<FormInstance>()
const editingId = ref<number | null>(null)
const editForm = reactive({
  title: '',
  desc: '',
  price: 0,
  categoryId: undefined as number | undefined,
  condition: '九成新' as ProductCondition,
  stock: 1
})

function openEdit(p: Product) {
  editingId.value = p.id!
  editForm.title = p.title
  editForm.desc = p.desc
  editForm.price = p.price
  editForm.categoryId = p.categoryId
  editForm.condition = p.condition
  editForm.stock = p.stock
  editVisible.value = true
}

async function saveEdit() {
  const valid = await editRef.value?.validate().catch(() => false)
  if (!valid || editingId.value === null) return
  await db.products.update(editingId.value, {
    title: editForm.title.trim(),
    desc: editForm.desc.trim(),
    price: editForm.price ?? 0,
    categoryId: editForm.categoryId!,
    condition: editForm.condition,
    stock: editForm.stock
  })
  editVisible.value = false
  ElMessage.success('已保存')
  await load()
}

onMounted(load)
onBeforeUnmount(() => imgUrls.value.forEach(u => URL.revokeObjectURL(u)))
</script>
