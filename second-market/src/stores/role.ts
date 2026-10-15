// ========== 角色 Store ==========
// 角色决定导航和路由守卫；视角决定"我"是谁
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RoleType } from '@/db/types'

export const useRoleStore = defineStore('role', () => {
  const currentRole = ref<RoleType>('buyer')
  const currentUserId = ref<number>(1)

  function setRole(role: RoleType) {
    currentRole.value = role
  }
  function setView(userId: number) {
    currentUserId.value = userId
  }

  // === 便捷 getter ===
  const isBuyer    = computed(() => currentRole.value === 'buyer')
  const isSeller   = computed(() => currentRole.value === 'seller')
  const isMerchant = computed(() => currentRole.value === 'merchant')
  const isAdmin    = computed(() => currentRole.value === 'admin')

  const roleLabel = computed(() => {
    const m: Record<RoleType, string> = {
      buyer: '买家', seller: '卖家', merchant: '商家', admin: '管理员'
    }
    return m[currentRole.value]
  })

  const roleColor = computed(() => {
    const m: Record<RoleType, string> = {
      buyer: '#409EFF', seller: '#67C23A', merchant: '#E6A23C', admin: '#F56C6C'
    }
    return m[currentRole.value]
  })

  return {
    currentRole, currentUserId, setRole, setView,
    isBuyer, isSeller, isMerchant, isAdmin, roleLabel, roleColor
  }
})
