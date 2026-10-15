<template>
  <el-form :model="form" label-width="80px" size="default">
    <el-form-item label="收件人">
      <el-input v-model="form.name" placeholder="姓名" class="w-48" />
    </el-form-item>
    <el-form-item label="联系电话">
      <el-input v-model="form.phone" placeholder="手机号" class="w-48" />
    </el-form-item>
    <el-form-item label="详细地址">
      <el-input v-model="form.detail" placeholder="宿舍/家庭地址" />
    </el-form-item>
    <el-form-item label="面交地点">
      <el-input v-model="form.faceMeetLocation" placeholder="如：图书馆门口 / 菜鸟驿站" />
    </el-form-item>
    <el-form-item label="面交时间">
      <el-input v-model="form.faceMeetTime" placeholder="如：10月18日 下午3点" />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'

export interface AddressForm {
  name: string
  phone: string
  detail: string
  faceMeetLocation: string
  faceMeetTime: string
}

const props = withDefaults(defineProps<{
  initial?: Partial<AddressForm>
}>(), { initial: () => ({}) })

const emit = defineEmits<{
  (e: 'update:modelValue', v: AddressForm): void
}>()

const form = reactive<AddressForm>({
  name: props.initial.name ?? '',
  phone: props.initial.phone ?? '',
  detail: props.initial.detail ?? '',
  faceMeetLocation: props.initial.faceMeetLocation ?? '',
  faceMeetTime: props.initial.faceMeetTime ?? ''
})

watch(form, (v) => emit('update:modelValue', { ...v }), { deep: true })
</script>
