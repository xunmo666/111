// ========== IndexedDB 表结构类型定义 ==========

export type RoleType = 'buyer' | 'seller' | 'merchant' | 'admin'

export interface Address {
  id?: number
  name: string
  phone: string
  detail: string
  isDefault?: boolean
}

export interface User {
  id?: number
  role: RoleType
  nickname: string
  avatar?: Blob
  contact: string
  college: string
  balance: number
  riskLevel: number
  addresses: Address[]
  createdAt: Date
}

export type MerchantStatus = 'pending' | 'approved' | 'rejected' | 'frozen'

export interface Merchant {
  id?: number
  userId: number
  shopName: string
  shopLogo?: Blob
  shopDesc: string
  status: MerchantStatus
  totalSales: number
  createdAt: Date
}

export interface Category {
  id?: number
  name: string
  icon: string
  parentId?: number | null
  sortOrder: number
}

export type ProductStatus = 'on' | 'off' | 'sold'
export type ProductCondition = '全新' | '九成新' | '八成新' | '七成新' | '二手'

export interface Product {
  id?: number
  title: string
  desc: string
  price: number
  condition: ProductCondition
  images: Blob[]
  categoryId: number
  userId: number
  merchantId?: number | null
  stock: number
  status: ProductStatus
  viewCount: number
  createdAt: Date
}

export interface CartItem {
  id?: number
  userId: number
  productId: number
  quantity: number
}

export type OrderStatus =
  | 'pending'        // 待付款
  | 'pay_confirmed'  // 已付款待面交
  | 'completed'      // 已完成
  | 'cancelled'      // 已取消
  | 'refund_pending' // 退款处理中
  | 'refunded'       // 已退款

export interface Order {
  id?: number
  orderNo: string
  userId: number
  sellerId: number
  merchantId?: number | null
  totalAmount: number
  status: OrderStatus
  address: string
  faceMeetLocation: string
  faceMeetTime: string
  shippingStatus: string
  couponId?: number | null
  promoId?: number | null
  remark?: string
  createdAt: Date
}

export interface ProductSnapshot {
  title: string
  price: number
  thumb?: Blob
  condition: string
}

export interface OrderItem {
  id?: number
  orderId: number
  productId: number
  productSnapshot: ProductSnapshot
  quantity: number
  priceAtBuy: number
}

export type RefundStatus = 'pending' | 'approved' | 'rejected'
export type RefundType = 'refund_only' | 'refund_return'

export interface Refund {
  id?: number
  orderId: number
  userId: number
  reason: string
  type: RefundType
  status: RefundStatus
  reviewNote?: string
  createdAt: Date
}

export interface OperationLog {
  id?: number
  userId?: number
  tableName: string
  recordId?: number
  action: string
  detail?: string
  riskLevel: number
  createdAt: Date
}
