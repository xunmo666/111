<template>
  <div class="max-w-3xl mx-auto px-6 py-6">
    <h2 class="text-xl font-bold mb-4">📝 提交订单</h2>

    <el-card class="mb-4">
      <template #header>商品清单（{{ rows.length }} 件）</template>
      <div v-for="r in rows" :key="r.productId" class="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
        <img v-if="r.imgUrl" :src="r.imgUrl" class="w-12 h-12 object-cover rounded" />
        <div class="flex-1">
          <div class="text-sm font-medium">{{ r.product?.title }}</div>
          <div class="text-xs text-gray-400">¥{{ r.product?.price }} × {{ r.qty }}</div>
        </div>
        <div class="text-red-500 font-bold">¥{{ (r.product?.price ?? 0) * r.qty }}</div>
      </div>
      <div class="text-right mt-2 text-lg">
        合计：<span class="text-red-500 font-bold text-2xl">¥{{ totalAmount }}</span>
      </div>
    </el-card>

    <el-card>
      <template #header>收货 / 面交信息</template>
      <el-form :model="form" label-width="100px">
        <el-form-item label="收件人"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="详细地址"><el-input v-model="form.detail" /></el-form-item>
        <el-form-item label="面交地点"><el-input v-model="form.faceMeetLocation" placeholder="如：图书馆门口" /></el-form-item>
        <el-form-item label="面交时间"><el-input v-model="form.faceMeetTime" placeholder="如：10月18日 14:00" /></el-form-item>
        <el-form-item label="买家备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
    </el-card>

    <!-- 结算 -->
    <div class="mt-4 bg-white p-4 rounded-lg border flex items-center justify-between">
      <div>
        <div class="text-sm">可用余额：¥{{ userStore.currentUser?.balance ?? 0 }}</div>
        <div class="text-lg mt-1">需支付：<span class="text-red-500 font-bold text-2xl">¥{{ totalAmount }}</span></div>
      </div>
      <div class="flex gap-2">
        <el-button @click="$router.back()">返回</el-button>
        <el-button type="primary" size="large" :loading="paying" @click="onPay">
          💳 确认支付
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { db } from '@/db'
import { genOrderNo } from '@/utils'
import type { Product } from '@/db/types'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import { useRoleStore } from '@/stores/role'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()
const roleStore = useRoleStore()

const paying = ref(false)

interface Row { productId: number; qty: number; product: Product | undefined; imgUrl: string; sellerId: number; merchantId: number | null }
const rows = ref<Row[]>([])

const form = ref({ name: '', phone: '', detail: '', faceMeetLocation: '', faceMeetTime: '', remark: '' })

async function load() {
  await cartStore.initialize(roleStore.currentUserId)
  await userStore.loadAll()

  const uid = roleStore.currentUserId
  const u = await db.users.get(uid)
  if (u?.addresses?.[0]) {
    form.value.name = u.nickname
    form.value.phone = u.contact
    form.value.detail = u.addresses[0].detail
  }

  const rs: Row[] = []
  for (const ci of cartStore.items) {
    const p = await db.products.get(ci.productId)
    if (!p) continue
    rs.push({
      productId: p.id!,
      qty: ci.quantity,
      product: p,
      imgUrl: p.images?.[0] ? URL.createObjectURL(p.images[0]) : '',
      sellerId: p.userId,
      merchantId: p.merchantId ?? null
    })
  }
  rows.value = rs
}

const totalAmount = computed(() =>
  rows.value.reduce((s, r) => s + (r.product?.price ?? 0) * r.qty, 0)
)

async function onPay() {
  if (!rows.value.length) return ElMessage.warning('购物车为空')
  if (paying.value) return
  paying.value = true

  try {
    const uid = roleStore.currentUserId
    const user = await db.users.get(uid)
    if (!user) return ElMessage.error('用户不存在')

    // 1. 余额检查
    if (user.balance < totalAmount.value) {
      ElMessage.error(`余额不足，还差 ¥${totalAmount.value - user.balance}`)
      paying.value = false
      return
    }

    // 2. 按卖家分组，创建订单（同一卖家的商品合并到同一订单）
    const bySeller = new Map<number, Row[]>()
    for (const r of rows.value) {
      const arr = bySeller.get(r.sellerId) ?? []
      arr.push(r); bySeller.set(r.sellerId, arr)
    }

    const now = new Date()
    let totalPaid = 0

    for (const [sellerId, items] of bySeller) {
      const amount = items.reduce((s, r) => s + (r.product?.price ?? 0) * r.qty, 0)
      const productSnapshot = items.map(r => ({
        title: r.product!.title,
        price: r.product!.price,
        condition: r.product!.condition,
        thumb: r.product!.images?.[0]
      }))

      const orderId = await db.orders.add({
        orderNo: genOrderNo(),
        userId: uid,
        sellerId,
        merchantId: items[0].merchantId,
        totalAmount: amount,
        status: 'pay_confirmed',
        address: `${form.value.name} ${form.value.phone} ${form.value.detail}`,
        faceMeetLocation: form.value.faceMeetLocation,
        faceMeetTime: form.value.faceMeetTime,
        shippingStatus: 'face_pending',
        couponId: null,
        promoId: null,
        remark: form.value.remark,
        createdAt: now
      })

      // 写 order_items
      for (let i = 0; i < items.length; i++) {
        const r = items[i]
        await db.order_items.add({
          orderId,
          productId: r.productId,
          productSnapshot: productSnapshot[i],
          quantity: r.qty,
          priceAtBuy: r.product!.price
        })
      }

      // 扣库存
      for (const r of items) {
        const p = await db.products.get(r.productId)
        if (!p) continue
        const newStock = Math.max(0, p.stock - r.qty)
        await db.products.update(r.productId, { stock: newStock, status: newStock === 0 ? 'sold' : p.status })
      }

      // 卖家余额到账（这里只给已完成订单到账，待面交阶段暂不到账 —— 不对，PRD 说付款即扣买家，面交确认才给卖家加）
      // 买家扣减在循环外统一扣
      totalPaid += amount
    }

    // 3. 统一扣买家余额
    await db.users.update(uid, { balance: user.balance - totalPaid })

    // 4. 清空购物车
    await cartStore.clear()
    await userStore.loadAll()

    ElMessage.success('支付成功！请按约定面交')
    router.push('/orders')
  } catch (err) {
    ElMessage.error('支付失败：' + (err as Error).message)
  } finally {
    paying.value = false
  }
}

onMounted(load)
onBeforeUnmount(() => rows.value.forEach(r => r.imgUrl && URL.revokeObjectURL(r.imgUrl)))
</script>
