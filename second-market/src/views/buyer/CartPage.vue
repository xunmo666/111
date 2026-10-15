<template>
  <div class="max-w-3xl mx-auto px-6 py-6">
    <h2 class="text-xl font-bold mb-4">🛒 购物车</h2>

    <template v-if="cartStore.items.length">
      <el-table :data="cartWithProduct" border>
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <img v-if="row.product.images?.[0]" :src="row.imgUrl" class="w-16 h-16 object-cover rounded" />
              <div>
                <div class="font-medium">{{ row.product.title }}</div>
                <div class="text-xs text-gray-400">¥{{ row.product.price }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="140" align="center">
          <template #default="{ row }">
            <el-input-number
              :model-value="row.cartItem.quantity"
              :min="1"
              :max="99"
              size="small"
              @change="cartStore.updateQty(row.cartItem.id!, $event)"
            />
          </template>
        </el-table-column>
        <el-table-column label="小计" width="100" align="center">
          <template #default="{ row }">
            <span class="text-red-500 font-bold">¥{{ row.product.price * row.cartItem.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button text type="danger" size="small" @click="cartStore.removeItem(row.cartItem.id!)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-6 flex items-center justify-between bg-white p-4 rounded-lg border border-gray-100">
        <div>
          <div class="text-sm text-gray-500">共 {{ cartStore.totalCount }} 件</div>
          <div class="text-lg">合计 <span class="text-red-500 font-bold text-2xl">¥{{ totalAmount }}</span></div>
        </div>
        <el-button type="primary" size="large" @click="$router.push('/checkout')">去结算</el-button>
      </div>
    </template>

    <EmptyState v-else text="购物车空空的，去逛逛吧" emoji="🛒">
      <router-link to="/"><el-button type="primary">去逛逛</el-button></router-link>
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { db } from '@/db'
import EmptyState from '@/components/EmptyState.vue'
import { useCartStore } from '@/stores/cart'
import { useRoleStore } from '@/stores/role'

const cartStore = useCartStore()
const roleStore = useRoleStore()

interface CartRow {
  cartItem: typeof cartStore.items[number]
  product: import('@/db/types').Product | undefined
  imgUrl: string
}

const rows = ref<CartRow[]>([])

async function load() {
  await cartStore.initialize(roleStore.currentUserId)
  const rs: CartRow[] = []
  for (const ci of cartStore.items) {
    const p = await db.products.get(ci.productId)
    if (!p) continue
    rs.push({
      cartItem: ci,
      product: p as any,
      imgUrl: p.images?.[0] ? URL.createObjectURL(p.images[0]) : ''
    })
  }
  rows.value = rs
}

const totalAmount = computed(() =>
  rows.value.reduce((s, r) => s + (r.product?.price ?? 0) * r.cartItem.quantity, 0)
)

onMounted(load)
onBeforeUnmount(() => rows.value.forEach(r => r.imgUrl && URL.revokeObjectURL(r.imgUrl)))

// 暴露给模板
const cartWithProduct = computed(() => rows.value)
</script>
