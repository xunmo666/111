<template>
  <el-select
    :model-value="roleStore.currentRole"
    size="small"
    class="w-24"
    @change="roleStore.setRole($event)"
  >
    <el-option label="买家"   value="buyer"   />
    <el-option label="卖家"   value="seller"  />
    <el-option label="商家"   value="merchant" />
    <el-option label="管理员" value="admin"   />
  </el-select>
</template>

<script setup lang="ts">
import { useRoleStore } from '@/stores/role'
const roleStore = useRoleStore()
</script>
