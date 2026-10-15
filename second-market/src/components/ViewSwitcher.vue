<template>
  <el-select
    :model-value="roleStore.currentUserId"
    size="small"
    class="w-28"
    placeholder="选择视角"
    :loading="userStore.loading"
    @change="(v: number) => userStore.switchView(v)"
  >
    <el-option
      v-for="u in userStore.users"
      :key="u.id"
      :label="`${u.nickname} (${u.role})`"
      :value="u.id"
    />
  </el-select>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoleStore } from '@/stores/role'
import { useUserStore } from '@/stores/user'

const roleStore = useRoleStore()
const userStore = useUserStore()

onMounted(() => {
  if (userStore.users.length === 0) userStore.loadAll()
})
</script>
