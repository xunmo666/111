// ========== Seed 数据注入 ==========
// 首次启动时自动注入演示数据；后续启动检测到数据存在则跳过
// 商品图片通过 Canvas 生成彩色占位图（不需要联网）

import { db } from './index'
import type { User, Merchant, Category, Product } from './types'

/** 生成一个带颜色的占位商品图（JPEG Blob） */
function makePlaceholder(color: string, label: string, w = 400, h = 400): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!

    // 背景渐变
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, color)
    grad.addColorStop(1, '#ffffff')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // 标签文字
    ctx.fillStyle = '#333'
    ctx.font = 'bold 48px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, w / 2, h / 2)

    // 次要文字
    ctx.fillStyle = '#888'
    ctx.font = '20px sans-serif'
    ctx.fillText('寻沫 · 闲置', w / 2, h / 2 + 60)

    canvas.toBlob((blob) => {
      resolve(blob as Blob)
    }, 'image/jpeg', 0.8)
  })
}

/** 订单号生成 */
export function genOrderNo(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const prefix = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${rand}`
}

/** 运行 seed（幂等：已有数据则跳过） */
export async function runSeed(): Promise<void> {
  const count = await db.products.count()
  if (count > 0) return

  // 1. 写入分类（先写入以获取 id）
  const categories: Omit<Category, 'id'>[] = [
    { name: '教材', icon: '📚', parentId: null, sortOrder: 1 },
    { name: '宿舍用品', icon: '🛏', parentId: null, sortOrder: 2 },
    { name: '电子设备', icon: '💻', parentId: null, sortOrder: 3 },
    { name: '运动器材', icon: '⚽', parentId: null, sortOrder: 4 },
    { name: '服饰化妆品', icon: '👕', parentId: null, sortOrder: 5 },
    { name: '票券', icon: '🎫', parentId: null, sortOrder: 6 },
    { name: '自行车', icon: '🚲', parentId: null, sortOrder: 7 },
    { name: '其他', icon: '📦', parentId: null, sortOrder: 99 }
  ]
  const catIds = await db.categories.bulkAdd(categories, { allKeys: true }) as number[]
  const [catBook, catDorm, catElec, catSport, , catTicket, catBike] = catIds

  // 2. 写入 4 个模拟用户
  const now = new Date()
  const users: Omit<User, 'id'>[] = [
    { role: 'buyer',  nickname: '张三', contact: 'wx_zhangsan', college: '计算机学院', balance: 10000, riskLevel: 0, addresses: [{ name: '张三', phone: '13800000001', detail: '1号楼302', isDefault: true }], createdAt: now },
    { role: 'buyer',  nickname: '李四', contact: 'qq_lisi',     college: '经济学院',   balance: 8000,  riskLevel: 0, addresses: [{ name: '李四', phone: '13800000002', detail: '2号楼501', isDefault: true }], createdAt: now },
    { role: 'merchant', nickname: '王五', contact: 'wx_wangwu',  college: '管理学院',   balance: 15000, riskLevel: 0, addresses: [{ name: '王五', phone: '13800000003', detail: '店铺', isDefault: true }], createdAt: now },
    { role: 'admin',  nickname: 'admin', contact: 'admin@campus', college: '—',         balance: 50000, riskLevel: 0, addresses: [], createdAt: now }
  ]
  const userIds = await db.users.bulkAdd(users, { allKeys: true }) as number[]
  const [uZhang, uLi, uWang] = userIds

  // 3. 写入商家（2 个已入驻）
  const merchants: Omit<Merchant, 'id'>[] = [
    { userId: uWang, shopName: '王五二手杂货铺', shopDesc: '学长学姐留下的好东西', status: 'approved', totalSales: 0, createdAt: now },
    { userId: uLi,  shopName: '阳光校园超市',   shopDesc: 'B2C 全新品折扣店',    status: 'approved', totalSales: 0, createdAt: now }
  ]
  const merchIds = await db.merchants.bulkAdd(merchants, { allKeys: true }) as number[]
  const [mWang, mLi] = merchIds

  // 4. 准备商品数据（颜色 + 分类 + 标签）
  type ProductSeed = {
    title: string; desc: string; price: number; condition: Product['condition']
    catId: number; userId: number; merchantId: number | null; color: string; label: string
  }

  const productSeeds: ProductSeed[] = [
    // C2C — 张三发布
    { title: '高等数学第七版', desc: '同济大学数学系编，几乎全新，无笔记', price: 35,  condition: '九成新', catId: catBook, userId: uZhang, merchantId: null, color: '#FFD54F', label: '高数教材' },
    { title: '线性代数及应用', desc: '清华版，少量笔记',                 price: 20,  condition: '八成新', catId: catBook, userId: uZhang, merchantId: null, color: '#81C784', label: '线代' },
    { title: '电子词典（卡西欧）', desc: '大一大二用了一年，电池健康80%', price: 180, condition: '九成新', catId: catElec, userId: uZhang, merchantId: null, color: '#64B5F6', label: '电子词典' },
    { title: '宿舍台灯', desc: 'LED护眼，三档调光，毕业带走',             price: 25,  condition: '九成新', catId: catDorm, userId: uZhang, merchantId: null, color: '#FFB74D', label: '台灯' },
    { title: '羽毛球拍（尤尼克斯）', desc: 'YONEX 入门款，打了5次',      price: 80,  condition: '九成新', catId: catSport, userId: uZhang, merchantId: null, color: '#E57373', label: '羽毛球拍' },
    { title: '演唱会门票×1', desc: '周杰伦校园专场，原价出',              price: 300, condition: '全新',   catId: catTicket, userId: uZhang, merchantId: null, color: '#BA68C8', label: '演唱会' },
    { title: '山地自行车', desc: '捷安特入门款，骑了两年',                price: 450, condition: '七成新', catId: catBike, userId: uZhang, merchantId: null, color: '#795548', label: '山地车' },

    // C2C — 李四发布
    { title: 'C++ Primer 第五版', desc: '英文版，全新未拆封',              price: 45,  condition: '全新',   catId: catBook, userId: uLi, merchantId: null, color: '#4FC3F7', label: 'C++书' },
    { title: 'MacBook Air 保护壳', desc: 'M1 款，白色，几乎全新',          price: 30,  condition: '九成新', catId: catElec, userId: uLi, merchantId: null, color: '#F06292', label: '电脑壳' },
    { title: 'Nike 跑鞋 42码', desc: '穿了半个学期，九成新',              price: 150, condition: '九成新', catId: catSport, userId: uLi, merchantId: null, color: '#FF7043', label: '耐克鞋' },
    { title: '考研英语真题', desc: '2018-2024 全套，有笔记',              price: 50,  condition: '八成新', catId: catBook, userId: uLi, merchantId: null, color: '#AED581', label: '考研真题' },
    { title: '毕业晚会门票', desc: '5月20日校庆晚会',                     price: 20,  condition: '全新',   catId: catTicket, userId: uLi, merchantId: null, color: '#CE93D8', label: '毕业晚会' },
    { title: '宿舍小风扇', desc: 'USB供电，三档',                          price: 15,  condition: '九成新', catId: catDorm, userId: uLi, merchantId: null, color: '#4DD0E1', label: '小风扇' },

    // B2C — 王五店铺
    { title: '全新笔记本支架', desc: '铝合金，可调节，店铺在售',           price: 48,  condition: '全新',   catId: catElec, userId: uWang, merchantId: mWang, color: '#546E7A', label: '支架' },
    { title: '机械键盘青轴', desc: '87键，RGB背光',                       price: 289, condition: '全新',   catId: catElec, userId: uWang, merchantId: mWang, color: '#26A69A', label: '键盘' },
    { title: '宿舍床上书桌', desc: '可折叠，免安装',                       price: 68,  condition: '全新',   catId: catDorm, userId: uWang, merchantId: mWang, color: '#8D6E63', label: '书桌' },
    { title: '瑜伽垫 加厚款', desc: '10mm 加厚，送绑带',                  price: 45,  condition: '全新',   catId: catSport, userId: uWang, merchantId: mWang, color: '#D4E157', label: '瑜伽垫' },
    { title: 'Python编程从入门到实践', desc: '第2版，全新正版',             price: 69,  condition: '全新',   catId: catBook, userId: uWang, merchantId: mWang, color: '#7E57C2', label: 'Python' },
    { title: '篮球（斯伯丁）', desc: '7号球，PU材质',                     price: 99,  condition: '全新',   catId: catSport, userId: uWang, merchantId: mWang, color: '#F4511E', label: '篮球' },

    // B2C — 李四店铺
    { title: '无线蓝牙耳机', desc: '入耳式，主动降噪',                     price: 199, condition: '全新',   catId: catElec, userId: uLi, merchantId: mLi, color: '#5C6BC0', label: '耳机' },
    { title: '大学物理教材', desc: '第六版，全新',                         price: 55,  condition: '全新',   catId: catBook, userId: uLi, merchantId: mLi, color: '#29B6F6', label: '物理' },
    { title: '保温杯 500ml', desc: '304不锈钢，保冷保热',                 price: 39,  condition: '全新',   catId: catDorm, userId: uLi, merchantId: mLi, color: '#FF8A65', label: '保温杯' },
    { title: '考研政治红宝书', desc: '2025版，全新',                       price: 65,  condition: '全新',   catId: catBook, userId: uLi, merchantId: mLi, color: '#EF5350', label: '红宝书' },
    { title: '宿舍收纳盒×3', desc: '磨砂半透明，组合套装',                 price: 29,  condition: '全新',   catId: catDorm, userId: uLi, merchantId: mLi, color: '#BCAAA4', label: '收纳盒' }
  ]

  // 批量生成图片 + 写入商品
  const products: Omit<Product, 'id'>[] = []
  for (const ps of productSeeds) {
    const img = await makePlaceholder(ps.color, ps.label)
    products.push({
      title: ps.title,
      desc: ps.desc,
      price: ps.price,
      condition: ps.condition,
      images: [img],
      categoryId: ps.catId,
      userId: ps.userId,
      merchantId: ps.merchantId,
      stock: 1,
      status: 'on',
      viewCount: Math.floor(Math.random() * 30),
      createdAt: now
    })
  }
  void (await db.products.bulkAdd(products, { allKeys: true }))

  // 5. 写入几条示例订单（其中 1 条已完成，演示卖家余额增加）
  // 订单 #1 — 张三买了张三自己发布的"线性代数"（演示已完成）
  await db.orders.add({
    orderNo: genOrderNo(),
    userId: uZhang,
    sellerId: uZhang, // 同一个人，演示数据需要
    merchantId: null,
    totalAmount: 20,
    status: 'completed',
    address: '1号楼302',
    faceMeetLocation: '图书馆门口',
    faceMeetTime: '2026-10-10 16:00',
    shippingStatus: 'face_confirmed',
    remark: '',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000)
  })

  // 订单 #2 — 李四买了王五店铺的键盘（待面交）
  await db.orders.add({
    orderNo: genOrderNo(),
    userId: uLi,
    sellerId: uWang,
    merchantId: mWang,
    totalAmount: 289,
    status: 'pay_confirmed',
    address: '2号楼501',
    faceMeetLocation: '菜鸟驿站',
    faceMeetTime: '2026-10-16 14:00',
    shippingStatus: 'face_pending',
    remark: '下午3点之前都可以',
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000)
  })

  // 订单 #3 — 张三买了李四店铺的耳机（待付款）
  await db.orders.add({
    orderNo: genOrderNo(),
    userId: uZhang,
    sellerId: uLi,
    merchantId: mLi,
    totalAmount: 199,
    status: 'pending',
    address: '1号楼302',
    faceMeetLocation: '食堂门口',
    faceMeetTime: '2026-10-17 12:00',
    shippingStatus: 'face_pending',
    remark: '',
    createdAt: new Date()
  })
}

/** 清空所有数据 + 重新注入 seed */
export async function resetAllData(): Promise<void> {
  // 逐个清空（Dexie transaction 在 v4 的 TS 类型有参数数量限制）
  await db.users.clear()
  await db.merchants.clear()
  await db.categories.clear()
  await db.products.clear()
  await db.cart_items.clear()
  await db.orders.clear()
  await db.order_items.clear()
  await db.refunds.clear()
  await db.operation_logs.clear()
  await runSeed()
}
