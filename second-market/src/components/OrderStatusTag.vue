<template>
  <el-tag :type="tagType" :effect="'light'">
    {{ label }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OrderStatus } from '@/db/types'

const props = defineProps<{ status: OrderStatus }>()

const map: Record<OrderStatus, { label: string; type: 'info' | 'warning' | 'success' | 'danger' | '' }> = {
  pending:         { label: '待付款',   type: 'warning' },
  pay_confirmed:   { label: '待面交',   type: 'info' },
  completed:       { label: '已完成',   type: 'success' },
  cancelled:       { label: '已取消',   type: 'info' },
  refund_pending:  { label: '退款中',   type: 'warning' },
  refunded:        { label: '已退款',   type: 'danger' }
}

const label = computed(() => map[props.status]?.label ?? props.status)
const tagType = computed(() => map[props.status]?.type ?? '')
</script>
