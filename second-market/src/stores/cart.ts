// ========== 购物车 Store ==========
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'
import type { CartItem } from '@/db/types'
import { useRoleStore } from './role'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  async function initialize(userId: number) {
    items.value = await db.cart_items.where('userId').equals(userId).toArray()
  }

  /** 添加商品到购物车（重复则合并） */
  async function addProduct(productId: number, qty = 1) {
    const roleStore = useRoleStore()
    const userId = roleStore.currentUserId

    // 查是否已有
    const existing = items.value.find(i => i.productId === productId)
    if (existing) {
      existing.quantity += qty
      await db.cart_items.update(existing.id!, { quantity: existing.quantity })
    } else {
      const id = await db.cart_items.add({ userId, productId, quantity: qty })
      items.value.push({ id, userId, productId, quantity: qty })
    }
  }

  async function removeItem(id: number) {
    await db.cart_items.delete(id)
    items.value = items.value.filter(i => i.id !== id)
  }

  async function updateQty(id: number, qty: number) {
    if (qty <= 0) return removeItem(id)
    await db.cart_items.update(id, { quantity: qty })
    const it = items.value.find(i => i.id === id)
    if (it) it.quantity = qty
  }

  async function clear() {
    const roleStore = useRoleStore()
    await db.cart_items.where('userId').equals(roleStore.currentUserId).delete()
    items.value = []
  }

  // === Getter ===
  const totalCount = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))

  return { items, initialize, addProduct, removeItem, updateQty, clear, totalCount }
})
