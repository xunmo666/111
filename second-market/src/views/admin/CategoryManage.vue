<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold">🗂 分类管理</h2>
      <el-button type="primary" @click="openAdd">＋ 新增分类</el-button>
    </div>

    <el-card shadow="never">
      <el-table :data="categories" v-loading="loading">
        <el-table-column label="ID" prop="id" width="60" />
        <el-table-column label="图标" width="80" align="center">
          <template #default="{ row }"><span class="text-xl">{{ row.icon }}</span></template>
        </el-table-column>
        <el-table-column label="名称" prop="name" min-width="140" />
        <el-table-column label="排序值" width="190" align="center">
          <template #default="{ row }">
            <el-input-number
              :model-value="row.sortOrder"
              size="small"
              :min="0"
              :step="1"
              @change="(v?: number) => updateSort(row, v)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-tooltip content="该分类下存在商品，禁止删除" :disabled="!productCountMap.get(row.id!)" placement="left">
              <span>
                <el-button
                  size="small"
                  type="danger"
                  plain
                  :disabled="!!productCountMap.get(row.id!)"
                  @click="removeCategory(row)"
                >删除</el-button>
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增分类弹窗 -->
    <el-dialog v-model="addVisible" title="新增分类" width="420px">
      <el-form ref="addRef" :model="addForm" label-width="80px">
        <el-form-item label="名称" prop="name" :rules="[{ required: true, message: '请输入分类名称', trigger: 'blur' }]">
          <el-input v-model="addForm.name" maxlength="20" placeholder="例如：乐器" />
        </el-form-item>
        <el-form-item label="图标" prop="icon" :rules="[{ required: true, message: '请输入图标 Emoji', trigger: 'blur' }]">
          <el-input v-model="addForm.icon" placeholder="例如：🎸" maxlength="4" />
        </el-form-item>
        <el-form-item label="排序值" prop="sortOrder">
          <el-input-number v-model="addForm.sortOrder" :min="0" :step="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">新增</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { db } from '@/db'
import type { Category } from '@/db/types'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const loading = ref(false)
const categories = ref<Category[]>([])
/** 分类 id → 关联商品数（用于禁用删除按钮） */
const productCountMap = ref<Map<number, number>>(new Map())

async function load() {
  await userStore.loadAll()
  loading.value = true
  try {
    categories.value = (await db.categories.toArray())
      .sort((a, b) => a.sortOrder - b.sortOrder)

    const map = new Map<number, number>()
    for (const p of await db.products.toArray()) {
      map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1)
    }
    productCountMap.value = map
  } finally {
    loading.value = false
  }
}

/** 直接修改 sortOrder */
async function updateSort(row: Category, v?: number) {
  const val = v ?? row.sortOrder
  if (val === row.sortOrder) return
  await db.categories.update(row.id!, { sortOrder: val })
  ElMessage.success(`「${row.name}」排序已更新为 ${val}`)
  await load()
}

/** 有关联商品时禁止删除 */
async function removeCategory(row: Category) {
  await ElMessageBox.confirm(`确定删除分类「${row.name}」？`, '删除分类', { type: 'warning' })

  const count = await db.products.where('categoryId').equals(row.id!).count()
  if (count > 0) {
    ElMessage.warning(`该分类下有 ${count} 件关联商品，禁止删除`)
    return
  }

  await db.categories.delete(row.id!)
  ElMessage.success(`分类「${row.name}」已删除`)
  await load()
}

// ========== 新增分类 ==========
const addVisible = ref(false)
const addRef = ref<FormInstance>()
const addForm = reactive({ name: '', icon: '', sortOrder: 99 })

function openAdd() {
  addForm.name = ''
  addForm.icon = ''
  addForm.sortOrder = 99
  addVisible.value = true
}

async function submitAdd() {
  const valid = await addRef.value?.validate().catch(() => false)
  if (!valid) return
  await db.categories.add({
    name: addForm.name.trim(),
    icon: addForm.icon.trim() || '📦',
    parentId: null,
    sortOrder: addForm.sortOrder
  })
  addVisible.value = false
  ElMessage.success(`分类「${addForm.name.trim()}」已新增`)
  await load()
}

onMounted(load)
</script>
