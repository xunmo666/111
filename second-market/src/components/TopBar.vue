<template>
  <header class="fixed top-0 left-0 right-0 z-50 h-14 bg-white shadow-sm border-b border-gray-100">
    <div class="h-full flex items-center gap-4 px-6">
      <router-link to="/" class="flex items-center gap-2 font-bold text-lg text-green-600">
        <span class="text-xl">🌱</span> 寻沫
      </router-link>

      <el-input
        v-model="searchText"
        placeholder="搜索商品关键词..."
        size="default"
        clearable
        class="max-w-md flex-1"
        @keyup.enter="onSearch"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>

      <div class="flex items-center gap-2 ml-auto">
        <span class="text-xs text-gray-400">视角</span>
        <ViewSwitcher />
        <span class="text-xs text-gray-400 ml-2">角色</span>
        <RoleSwitcher />
        <router-link to="/cart" class="ml-3 text-gray-600 hover:text-green-600 relative" title="购物车">
          <el-icon :size="22"><ShoppingCart /></el-icon>
          <el-badge v-if="cartStore.totalCount" :value="cartStore.totalCount" class="absolute -top-1 -right-2" />
        </router-link>
        <router-link to="/profile" class="ml-3 text-gray-600 hover:text-green-600" title="用户中心">
          <el-icon :size="22"><User /></el-icon>
        </router-link>
      </div>
    </div>
  </header>
  <div class="h-14" /><!-- 占位 -->
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ShoppingCart, User } from '@element-plus/icons-vue'
import RoleSwitcher from './RoleSwitcher.vue'
import ViewSwitcher from './ViewSwitcher.vue'
import { useCartStore } from '@/stores/cart'
import { useRoleStore } from '@/stores/role'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const cartStore = useCartStore()
const roleStore = useRoleStore()
const userStore = useUserStore()

const searchText = ref('')

function onSearch() {
  if (searchText.value.trim()) {
    router.push({ path: '/', query: { q: searchText.value.trim() } })
  } else {
    router.push({ path: '/' })
  }
}

// 路由变化时，加载当前用户购物车
watch(
  () => roleStore.currentUserId,
  async (uid) => {
    await cartStore.initialize(uid)
  },
  { immediate: true }
)

onMounted(async () => {
  if (userStore.users.length === 0) await userStore.loadAll()
  await cartStore.initialize(roleStore.currentUserId)
})
</script>
