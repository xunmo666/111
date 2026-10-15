// ========== Dexie 数据库定义 ==========
// 一次性定义全部 9 张表（包括 V1 不直接使用但预留的 operation_logs）
// 避免后续 schema 版本迁移

import Dexie, { type Table } from 'dexie'
import type {
  User, Merchant, Category, Product, CartItem,
  Order, OrderItem, Refund, OperationLog
} from './types'

export class SecondMarketDB extends Dexie {
  declare users:        Table<User, number>
  declare merchants:    Table<Merchant, number>
  declare categories:   Table<Category, number>
  declare products:     Table<Product, number>
  declare cart_items:   Table<CartItem, number>
  declare orders:       Table<Order, number>
  declare order_items:  Table<OrderItem, number>
  declare refunds:      Table<Refund, number>
  declare operation_logs: Table<OperationLog, number>

  constructor() {
    super('second_market_v1')
    this.version(1).stores({
      users:          '++id, role, riskLevel',
      merchants:      '++id, &userId, status',
      categories:     '++id, parentId, sortOrder',
      products:       '++id, userId, merchantId, categoryId, status, price',
      cart_items:     '++id, userId, productId',
      orders:         '++id, &orderNo, userId, sellerId, status, createdAt',
      order_items:    '++id, orderId',
      refunds:        '++id, orderId, userId, status',
      operation_logs: '++id, userId, tableName, recordId, createdAt'
    })
  }
}

export const db = new SecondMarketDB()
