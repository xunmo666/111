<template>
  <div class="flex h-screen overflow-hidden">
    <!-- 左侧固定深色侧边栏，宽度 200px -->
    <aside class="w-[200px] shrink-0 bg-[#1f2937] text-white flex flex-col">
      <div class="px-4 py-4 border-b border-white/10">
        <div class="font-bold text-sm">🛡️ 寻沫 · 管理后台</div>
      </div>

      <!-- 页面内视角 / 角色切换器 -->
      <div class="px-3 py-3 flex flex-col gap-2 border-b border-white/10">
        <div class="text-[11px] text-gray-500">当前视角</div>
        <ViewSwitcher />
        <div class="text-[11px] text-gray-500 mt-1">当前角色</div>
        <RoleSwitcher />
      </div>

      <!-- 主菜单 -->
      <el-menu
        :default-active="activePath"
        router
        class="admin-menu flex-1"
        background-color="#1f2937"
        text-color="#9ca3af"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/admin">📊 概览</el-menu-item>
        <el-menu-item index="/admin/products">✅ 商品审核</el-menu-item>
        <el-menu-item index="/admin/merchants">🏪 商家审核</el-menu-item>
        <el-menu-item index="/admin/users">👥 用户管理</el-menu-item>
        <el-menu-item index="/admin/orders">📋 订单</el-menu-item>
        <el-menu-item index="/admin/categories">🗂 分类</el-menu-item>
        <el-menu-item index="/admin/refunds">⚠ 售后</el-menu-item>
        <el-menu-item index="/admin/settings">⚙ 设置</el-menu-item>
      </el-menu>

      <div class="px-4 py-3 border-t border-white/10 text-xs">
        <router-link to="/" class="text-gray-400 hover:text-white transition-colors">← 返回前台</router-link>
      </div>
    </aside>

    <!-- 右侧内容区 -->
    <main class="flex-1 overflow-auto bg-gray-50">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ViewSwitcher from '@/components/ViewSwitcher.vue'
import RoleSwitcher from '@/components/RoleSwitcher.vue'

const route = useRoute()
const activePath = computed(() => route.path)
</script>

<style scoped>
.admin-menu {
  border-right: none;
}
.admin-menu :deep(.el-menu-item.is-active) {
  background-color: #111827;
}
</style>
