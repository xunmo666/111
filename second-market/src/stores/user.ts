// ========== 用户 Store ==========
// 从 Dexie 加载所有用户和商家；余额操作；视角切换联动
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'
import type { User, Merchant } from '@/db/types'
import { useRoleStore } from './role'

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const merchants = ref<Merchant[]>([])
  const loading = ref(false)

  async function loadAll() {
    loading.value = true
    try {
      users.value = await db.users.toArray()
      merchants.value = await db.merchants.toArray()
    } finally {
      loading.value = false
    }
  }

  /** 视角切换时同步更新 roleStore.currentRole */
  async function switchView(userId: number) {
    const u = users.value.find(x => x.id === userId)
    if (!u) return
    useRoleStore().setView(userId)
    useRoleStore().setRole(u.role)
  }

  /** 扣余额（返回是否足够） */
  async function debit(userId: number, amount: number, _reason = ''): Promise<boolean> {
    const u = await db.users.get(userId)
    if (!u || u.balance < amount) return false
    await db.users.update(userId, { balance: u.balance - amount })
    await loadAll()
    // TODO: 写 operation_logs（Stage 9）
    return true
  }

  /** 加余额 */
  async function credit(userId: number, amount: number, _reason = ''): Promise<void> {
    const u = await db.users.get(userId)
    if (!u) return
    await db.users.update(userId, { balance: u.balance + amount })
    await loadAll()
  }

  const currentUser = computed(() => {
    const roleStore = useRoleStore()
    return users.value.find(u => u.id === roleStore.currentUserId) || null
  })

  const currentMerchant = computed(() => {
    const roleStore = useRoleStore()
    return merchants.value.find(m => m.userId === roleStore.currentUserId) || null
  })

  return { users, merchants, loading, loadAll, switchView, debit, credit, currentUser, currentMerchant }
})
