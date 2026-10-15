# 寻沫 · V1 开发计划（DEVPLAN）

> 配套文档：PRD.md（已确认，冻结）  
> 计划版本：V1.0  
> 日期：2026-10-15  
> 状态：待执行，每个阶段完成后需过 gate 才能进入下一阶段

---

## 计划总览

| 阶段 | 名称 | 优先级 | 完成标志 | 对应 PRD 验收项 |
|------|------|--------|---------|----------------|
| **Stage 0** | 项目脚手架 + 数据库基建 | 🔴 P0 | 首次启动能看到 seed 数据在 IndexedDB 里 | —（基建无验收） |
| **Stage 1** | Pinia Stores + 路由守卫 | 🔴 P0 | 角色切换器可切换、路由守卫拦截正确 | P0-7 / P0-8 / P0-9 / P0-10 |
| **Stage 2** | 全局共享组件 + 工具库 | 🔴 P0 | TopBar 正常显示、ProductCard 渲染 seed 商品、ImageUploader 压缩测试通过 | P0-39 / P0-40 |
| **Stage 3** | 买家端（首页 → 商品详情） | 🔴 P0 | 首页显示 seed 商品、分类 Tab 过滤生效、详情页可打开 | P0-2 / P0-22 / P0-23 / P0-24 / P0-25 |
| **Stage 4** | 购物流程闭环（购物车 → 下单 → 支付 → 订单 → 面交） | 🔴 P0 | 完整链路走通、刷新后数据保留 | P0-15 / P0-16 / P0-17 / P0-18 / P0-19 / P0-20 / P0-21 |
| **Stage 5** | 卖家端 + 商品上下架 | 🔴 P0 | 能发布商品、上下架生效、售罄自动下架 | P0-13 / P0-26 / P0-27 |
| **Stage 6** | 商家端（入驻 → 店铺 → 商品 → 订单） | 🟡 P1 | 入驻审核流程完整、店铺首页可公开访问 | P0-28 / P0-29 / P0-30 |
| **Stage 7** | 管理后台（Dashboard + 审核 + 分类 + 用户） | 🟡 P1 | Dashboard 数字正确、商品/商家审核生效、分类增删改 | P0-33 / P0-34 / P0-35 |
| **Stage 8** | 售后工单 + 数据备份恢复 | 🟡 P1 | 退款审核自动回补余额、JSON 导出/导入/重置 | P0-31 / P0-32 / P0-36 / P0-37 / P0-38 |
| **Stage 9** | 全量验收 + 打磨 | 🟡 P1 | PRD 第 10 节 41 条验收标准逐条通过 | 全部 41 条 |

---

## Stage 0 · 项目脚手架 + 数据库基建

### 目标
从零创建 Vue3+Vite+TS 工程，安装全部依赖，定义 Dexie 9 表 schema，实现 seed 数据注入，让"首次打开应用"这个动作就能跑起来。

### 产出文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `package.json` | vite 生成 | 锁定 Vite 5 / Vue 3.4+ / TS 5 |
| `vite.config.ts` | 生成 + 编辑 | 添加 @vitejs/plugin-vue、路径别名 `@` → `src` |
| `tsconfig.json` | 生成 + 编辑 | 添加 `baseUrl` 和 `paths` 映射 |
| `index.html` | vite 生成 | 修改 `<title>` 为"寻沫·校园二手" |
| `tailwind.config.js` | 新建 | content 指向 `./index.html, ./src/**/*.{vue,ts,tsx}` |
| `postcss.config.js` | 新建 | tailwindcss + autoprefixer |
| `src/main.ts` | vite 生成 | 注册 Vue / Router / Pinia / ElementPlus / Tailwind |
| `src/style.css` | vite 生成 | 顶部加 `@tailwind base; @tailwind components; @tailwind utilities;` |
| **`src/db/index.ts`** | **新建** | **Dexie 数据库实例 + 全部 9 表 schema 一次性定义** |
| **`src/db/seed.ts`** | **新建** | **Seed 数据生成函数 + 首次启动检测注入逻辑** |
| `src/db/types.ts` | 新建 | 全部 9 张表的 TypeScript interface 定义 |

### 执行命令（按顺序）

```bash
# 1. 脚手架（在 c:\Users\admin\Desktop\寻沫 目录执行）
cd "c:\Users\admin\Desktop\寻沫"
npm create vite@latest second-market -- --template vue-ts
cd second-market

# 2. 安装运行时依赖
npm install dexie element-plus @element-plus/icons-vue pinia vue-router@4 lucide-vue-next

# 3. 安装开发依赖
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p    # 自动生成 tailwind.config.js + postcss.config.js
```

### 关键实现要点

**① Dexie schema（`src/db/index.ts`）** — 一次性定义全部 9 表，包括 V1 预留表：

```typescript
// src/db/index.ts 核心结构
import Dexie, { type Table } from 'dexie'

export interface DB extends Dexie {
  users:             Table<User, number>
  merchants:         Table<Merchant, number>
  categories:        Table<Category, number>
  products:          Table<Product, number>
  cart_items:        Table<CartItem, number>
  orders:            Table<Order, number>
  order_items:       Table<OrderItem, number>
  refunds:           Table<Refund, number>
  operation_logs:    Table<OperationLog, number>
}

export const db = new Dexie('second_market_v1') as DB
db.version(1).stores({
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
```

**② Seed 数据（`src/db/seed.ts`）** — 检测"表是否为空"，为空则注入：

```typescript
// src/db/seed.ts 核心逻辑
export async function runSeed() {
  const productCount = await db.products.count()
  if (productCount > 0) return  // 已有数据，跳过

  // 1. 注入 users：张三(学生,余额10000)、李四(学生,余额8000)、王五(商家,余额15000)、admin(余额50000)
  // 2. 注入 merchants：王五二手铺、阳光校园超市（status=approved）
  // 3. 注入 categories：教材/宿舍/电子/运动/服饰/票券/其他 + sortOrder
  // 4. 注入 products：~30 件，C2C 15 件（userId=张三/李四），B2C 15 件（merchantId=商家 id）
  // 5. 注入 orders + order_items：若干覆盖不同状态的示例订单
}
```

**③ main.ts 启动逻辑**：在创建应用前先调用 `await runSeed()`。

### Stage 0 Gate（必须全部满足才能进 Stage 1）
- [ ] `npm run dev` 启动无报错，浏览器打开 http://localhost:5173
- [ ] DevTools → Application → IndexedDB → 看到 `second_market_v1` 数据库和 9 张表
- [ ] `users` 表有 4 条数据，`categories` 有 8 条，`products` 有 ~30 条
- [ ] `db.products.toArray()` 在 Console 执行能打印出完整 seed 商品数组

---

## Stage 1 · Pinia Stores + 路由守卫

### 目标
实现角色切换 store、当前用户 store、购物车 store，以及带角色权限判断的 Vue Router 路由守卫。

### 产出文件清单

| 文件 | 说明 |
|------|------|
| **`src/stores/role.ts`** | 角色状态：currentRole、setRole()、autoDetectFromRoute()、四个 isXxx getter |
| **`src/stores/user.ts`** | 当前视角用户：currentUserId、switchUser()、updateBalance()、loadAll() |
| **`src/stores/cart.ts`** | 购物车：items 缓存、add/remove/updateQty/clear、checkout()、loadFromDb() |
| **`src/router/index.ts`** | 完整路由表（买家 8 + 卖家 2 + 商家 4 + 管理 8）+ meta.requiredRoles + beforeEach 守卫 |

### 关键实现要点

**① 角色枚举**：
```typescript
export type RoleType = 'buyer' | 'seller' | 'merchant' | 'admin'
```

**② 路由守卫**：
```typescript
router.beforeEach((to) => {
  const roleStore = useRoleStore()
  if (to.meta.requiredRoles && !to.meta.requiredRoles.includes(roleStore.currentRole)) {
    return '/'  // 无权访问，回首页
  }
})
```

**③ 购物车 store 的生命周期**：
- `initialize(userId)` → 启动时读 Dexie `cart_items` 到内存缓存
- `addProduct(productId, qty)` → 查缓存是否已有 → 有则合并数量，无则新插入 → **同步写 Dexie**
- `checkout(orderForm)` → 创建 orders + order_items → 扣余额 → 清购物车 → **全部写 Dexie**

### Stage 1 Gate
- [ ] 顶栏 RoleSwitcher 切换 4 种角色，Pinia DevTools 中 `roleStore.currentRole` 实时变化
- [ ] 视角切换器切换张三/李四，`userStore.currentUserId` 变化，余额和订单随之变
- [ ] 角色=buyer 时手动访问 `/admin` → 被重定向到 `/`
- [ ] 角色=admin 时访问 `/admin` → 正常进入
- [ ] 切换角色后刷新 → store 状态正确恢复（Pinia 持久化用 Dexie 或简单手动同步）

---

## Stage 2 · 全局共享组件 + 工具库

### 目标
完成所有跨页面复用的组件和工具函数，尤其是 **ImageUploader（图片压缩 + Blob 存储）**——这是后续所有图片相关功能的基础设施。

### 产出文件清单

| 文件 | 说明 |
|------|------|
| **`src/components/RoleSwitcher.vue`** | 顶栏角色下拉（4 选 1），Element Plus Select |
| **`src/components/ViewSwitcher.vue`** | 顶栏视角下拉（张三/李四/王五/admin），Select |
| **`src/components/TopBar.vue`** | 顶部固定栏：Logo + 搜索框 + RoleSwitcher + ViewSwitcher |
| **`src/components/CategoryTabs.vue`** | 横向滚动分类 Tab（全部 + 8 校园分类），从 categories 表读取 |
| **`src/components/ProductCard.vue`** | 商品卡片（图+价格+标题+成色），网格中用 |
| **`src/components/OrderStatusTag.vue`** | 订单状态彩色徽章 |
| **`src/components/EmptyState.vue`** | 空状态占位图 + 提示文字 |
| **`src/components/**ImageUploader.vue`** | 多图上传 + Canvas 压缩 + Blob 存储，最多 6 张 |
| **`src/components/AddressSelector.vue`** | 收货地址列表选择 + 面交地点输入 |
| **`src/utils/imageCompress.ts`** | 图片压缩函数（Canvas + toBlob），输入 File → 输出 Blob，目标 1280×1280 / JPEG / 0.8 |
| **`src/utils/orderNo.ts`** | 订单号生成：`YYYYMMDD-` + 4 位随机数 |
| **`src/utils/balance.ts`** | 余额操作：debit（扣）/ credit（加）+ 校验 |

### 关键实现要点

**ImageUploader 的压缩流程**：
```
用户选图 → FileReader.readAsDataURL → Image.onload
→ Canvas 最大边长 1280 等比缩放 → canvas.toBlob('image/jpeg', 0.8)
→ 输出 Blob 数组 → 存入 products.images[]
```

**ProductCard 的图片显示**：products.images 是 Blob 数组，渲染时用 `URL.createObjectURL(blob)`，组件 `onUnmounted` 时 `URL.revokeObjectURL()` 释放内存。

### Stage 2 Gate
- [ ] ImageUploader：选一张 5MB 原图 → IndexedDB Blob 查看大小 < 500KB
- [ ] ImageUploader：连续选 7 张 → 第 7 张被阻止并弹出 Element Plus ElMessage 提示
- [ ] ProductCard 能渲染 seed 商品的图片（从 Blob 生成 object URL）
- [ ] 刷新页面 → 所有图片仍正常显示

---

## Stage 3 · 买家端（首页 → 商品详情）

### 目标
买家入口两个核心页面跑通：首页商品网格浏览、分类/搜索/排序/筛选全部生效；商品详情页完整显示。

### 产出文件清单

| 文件 | 说明 |
|------|------|
| **`src/views/buyer/HomePage.vue`** | 首页：TopBar + CategoryTabs + 快捷入口行 + ProductCard 网格 + 筛选栏 |
| **`src/views/buyer/ProductDetail.vue`** | 详情页：图片轮播 + 商品信息 + 联系卖家 + 底部收藏/加购物车/立即购买 |

### 关键实现要点

**首页数据加载**：
```typescript
// onMounted: db.products.where('status').equals('on').toArray()
// 然后根据 selectedCatId / keyword / condition / sort 进一步过滤
```

**分类切换**：选中 categoryId 后重新查 `db.products.where('categoryId').equals(catId).and(p => p.status === 'on').toArray()`。

**搜索**：`db.products.filter(p => p.title.includes(keyword) || p.desc.includes(keyword)).toArray()`（单机 ~30 条数据量，filter 足够）。

**排序**：先 fetch 全部 → `.sort((a,b) => a.price - b.price)` 内存排序。

**详情页浏览计数**：`onMounted` → `db.products.update(id, { viewCount: db.products.viewCount + 1 })`。

### Stage 3 Gate
- [ ] `P0-2`：刷新后首页商品列表保留
- [ ] `P0-22`：点"教材"Tab → 只显示教材类商品
- [ ] `P0-23`：搜索"词典" → 只显示标题/描述含"词典"的
- [ ] `P0-24`：价格升序/降序切换生效
- [ ] `P0-25`：成色筛选生效
- [ ] 点击商品卡片 → 跳转 `/product/:id` → 详情页显示完整信息（含图片、联系卖家）
- [ ] 打开详情 → F5 → viewCount + 1

---

## Stage 4 · 购物流程闭环

### 目标
**P0 最核心阶段**：购物车 → 提交订单 → 模拟支付 → 订单列表 → 面交确认，全链路跑通，刷新后数据保留。

### 产出文件清单

| 文件 | 说明 |
|------|------|
| **`src/views/buyer/CartPage.vue`** | 购物车：商品列表 + 数量 + 合计 + 地址选择 + 提交按钮 |
| **`src/views/buyer/CheckoutConfirm.vue`** | 结算确认页（选地址/备注/面交地点 → 创建订单） |
| **`src/views/buyer/OrderList.vue`** | 订单列表：状态 Tab + 订单卡片（分别展示买/卖） |
| **`src/views/buyer/OrderDetail.vue`** | 订单详情：商品清单 + 状态 + 面交信息 + 操作按钮 |

### 订单状态流转代码逻辑

```typescript
// checkout() → 写入 orders(status='pending') + order_items
// 支付按钮 → 
//   if (balance >= totalAmount) → 
//     1. db.orders.update(id, { status: 'pay_confirmed' })
//     2. db.users.update(userId, { balance: balance - totalAmount })
//     3. 扣减 stock
//     4. cart.clear()
//   else → ElMessage.warning('余额不足')，return
// 面交确认 →
//   1. db.orders.update(id, { status: 'completed' })
//   2. db.users.update(sellerId, { balance: sellerBalance + totalAmount })
```

### Stage 4 Gate
- [ ] `P0-15`：详情页点"加入购物车" → 购物车数量 +1
- [ ] `P0-16`：购物车 `-` `+` 按钮 → 合计实时更新
- [ ] `P0-17`：提交订单 → 订单出现在列表，状态=pending
- [ ] `P0-18`：余额充足支付 → 扣减成功 → 订单变 pay_confirmed
- [ ] `P0-19`：余额不足 → 提示，订单状态不变
- [ ] `P0-20`：角色切到卖家 → 订单出现在"我卖出的"
- [ ] `P0-21`：点"确认面交" → 订单变 completed + 卖家余额增加
- [ ] `P0-1`：F5 刷新 → 购物车内容保留
- [ ] `P0-3`：F5 刷新 → 订单列表完好

---

## Stage 5 · 卖家端 + 商品上下架

### 目标
卖家能发布/编辑/下架/上架商品，下架和售罄不影响交易中的订单。

### 产出文件清单

| 文件 | 说明 |
|------|------|
| **`src/views/seller/ProductManage.vue`** | 我发布的商品：状态 Tab（全部/在售/已售/下架）+ 商品行 + [下架][编辑][删除] |
| **`src/views/seller/OrderManage.vue`** | 我卖出的订单：按状态筛选 |
| **`src/views/buyer/PublishProduct.vue`** | 发布商品表单（标题/描述/价格/分类/成色/最多 6 图 + ImageUploader） |

### 关键实现要点

**库存扣减**：
```typescript
// 支付时（Stage 4 已有）加一步
await db.products.transaction('rw', db.products, db.order_items, async () => {
  // 1. 扣减 stock
  await db.products.where('id').equals(productId).modify(p => {
    p.stock -= quantity
    if (p.stock <= 0) p.status = 'sold'
  })
  // 2. 写 order_items
})
```

**删除限制**：有正在交易的订单（status != completed/cancelled/refunded）的商品不能删，ElMessage 提示。

### Stage 5 Gate
- [ ] `P0-13`：发布商品 → 首页出现新商品
- [ ] `P0-26`：下架商品 → 买家首页看不到，卖家列表里还在
- [ ] `P0-27`：下单扣减到 stock=0 → status 自动变 sold → 首页消失
- [ ] 卖家可编辑自己的商品（标题/描述/价格/图片）
- [ ] 有进行中订单的商品 → 删除按钮禁用或提示

---

## Stage 6 · 商家端

### 目标
商家身份申请 → 管理员审核 → 店铺可运营 → 店铺前台公开。

### 产出文件清单

| 文件 | 说明 |
|------|------|
| **`src/views/merchant/MerchantHome.vue`** | 商家后台首页：4 数据卡 + 功能入口 + 待处理提醒 |
| **`src/views/merchant/MerchantProducts.vue`** | 店铺商品管理 |
| **`src/views/merchant/MerchantOrders.vue`** | 店铺订单管理 |
| **`src/views/merchant/MerchantSettings.vue`** | 店铺资料编辑（名称/简介/Logo）+ 申请入驻入口 |
| **`src/views/buyer/MerchantShopHome.vue`** | 店铺前台首页（公开）：店铺介绍 + 店铺内商品 |

### 关键实现要点

**入驻流程**：
```typescript
// 买家/卖家 → MerchantSettings.vue → 填写资料 → 提交
// 1. db.merchants.add({ userId, shopName, ..., status: 'pending' })
// 2. 角色 store 的 merchant tab 变为"审核中"灰色禁用态
// 管理员在 AdminMerchantAudit.vue 通过 →
//   db.merchants.where('userId').equals(userId).modify({ status: 'approved' })
// 角色 store 自动可切换
```

**商家商品**：发布时 merchantId = 当前用户 merchants.id，userId = 当前 users.id，C2C 商品 merchantId = null。

### Stage 6 Gate
- [ ] `P0-28`：点"开启商家身份" → 管理员后台看到待审核
- [ ] `P0-29`：管理员通过 → 商家角色可用
- [ ] `P0-30`：访问 `/merchant/:id` → 店铺前台公开
- [ ] 商家 Dashboard 4 数据卡数字与实际一致
- [ ] 商家能管理店铺商品和订单

---

## Stage 7 · 管理后台

### 目标
管理员能用 Dashboard 看全局数据，能审核商品/商家，能管理分类和用户，能查看全平台订单。

### 产出文件清单

| 文件 | 说明 |
|------|------|
| **`src/views/admin/AdminLayout.vue`** | 左侧栏 + 主内容区布局（独立于买家端的 TopBar） |
| **`src/views/admin/Dashboard.vue`** | 4 数据卡 + 审核队列快速预览 |
| **`src/views/admin/ProductAudit.vue`** | 商品审核列表（筛选 status=pending）+ [通过][下架] |
| **`src/views/admin/UserManage.vue`** | 用户列表 + 启用/禁用 |
| **`src/views/admin/MerchantAudit.vue`** | 商家入驻审核列表 + [通过][拒绝] |
| **`src/views/admin/OrderManage.vue`** | 全平台订单查看 |
| **`src/views/admin/CategoryManage.vue`** | 分类增删改（Element Plus Tree 或简单列表） |
| **`src/views/admin/RefundManage.vue`** | 售后工单列表 + 审核 |
| **`src/views/admin/SystemSettings.vue`** | 导出 JSON / 导入 JSON / 重置全部数据 |

### 关键实现要点

**Dashboard 4 个数字的计算**：
```typescript
const totalSales   = await db.orders.where('status').anyOf('pay_confirmed', 'completed').toArray()
                     → 累加 totalAmount
const orderCount   = await db.orders.count()
const productCount = await db.products.where('status').equals('on').count()
const merchantCount = await db.merchants.where('status').equals('approved').count()
```

**分类管理**：Element Plus `<el-input-number>` 调整 sortOrder，删除时检查是否有 products 关联（有则阻止）。

### Stage 7 Gate
- [ ] `P0-33`：Dashboard 4 数字与实际一致（手动对比 Dexie 数据）
- [ ] `P0-34`：审核商品"通过" → 商品 status=on → 首页立即出现
- [ ] `P0-35`：新增分类 → 买家首页 Tab 多一个
- [ ] 商家审核"通过" → 商家 status=approved
- [ ] 全平台订单能按状态/时间/用户筛选

---

## Stage 8 · 售后 + 数据备份恢复

### 目标
退款工单完整闭环 + JSON 导出/导入/重置（数据安全兜底）。

### 产出文件清单

| 文件 | 说明 |
|------|------|
| **`src/components/RefundApply.vue`** | 买家发起退款的表单弹窗（原因 + 类型） |
| **`src/views/admin/RefundManage.vue`** | 售后工单列表 + 审核表单（Stage 7 已有基础，这里补完整逻辑） |
| **`src/utils/backup.ts`** | `exportAll()` → 全表 JSON 序列化 + 触发浏览器下载；`importAll(json)` → 清空所有表 + 批量写入 |
| **`src/views/admin/SystemSettings.vue`** | 三按钮：导出 / 导入 / 重置（补 Stage 7 未完成的按钮） |

### 关键实现要点

**退款审核同意时的原子操作**：
```typescript
await db.transaction('rw', db.orders, db.refunds, db.users, async () => {
  // 1. 写 refunds.status = 'approved'
  // 2. 改 orders.status = 'refunded'
  // 3. 回补买家余额 (users.balance += order.totalAmount)
  // 4. 扣卖家余额 (users.balance -= order.totalAmount) —— 这里是从卖家方扣
})
```

**JSON 导出/导入**：
```typescript
// 导出
const allData = {
  users: await db.users.toArray(),
  merchants: await db.merchants.toArray(),
  categories: await db.categories.toArray(),
  products: await db.products.toArray(),
  cart_items: await db.cart_items.toArray(),
  orders: await db.orders.toArray(),
  order_items: await db.order_items.toArray(),
  refunds: await db.refunds.toArray()
}
const blob = new Blob([JSON.stringify(allData)], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url; a.download = `second-market-backup-${Date.now()}.json`; a.click()

// 导入：先 transaction 清空 + 批量写入
```

### Stage 8 Gate
- [ ] `P0-31`：买家发起退款 → 管理员看到工单
- [ ] `P0-32`：审核同意 → 买家余额恢复 + 卖家余额扣减 + 订单变 refunded
- [ ] 审核拒绝 → 工单 status=rejected + 填写拒绝理由
- [ ] `P0-36`：导出 JSON → 浏览器下载成功
- [ ] `P0-37`：清空数据后导入刚导出的 JSON → 所有数据恢复
- [ ] `P0-38`：重置 → 清空全部表 → seed 重新注入
- [ ] 大事务退款/导入不抛异常（Dexie 事务处理 Blob 要注意大小）

---

## Stage 9 · 全量验收 + 打磨

### 目标
按 PRD 第 10 节 **41 条验收标准** 逐条手动测试，修复问题，补齐空状态、Loading 态、Element Plus 样式微调。

### 执行流程

```
1. 打开应用 → 按验收清单逐条测试（每条记 PASS/FAIL）
2. FAIL 的条目 → 修复 → 回归
3. 全部 41 条 PASS → 对 Element Plus 组件微调样式（颜色、间距、圆角）
4. 空状态检查：购物车为空 / 订单为空 / 商家未入驻提示
5. 边界用例：
   - 余额为 0 时能否发起退款申请？
   - 商品被下架后购物车里还留着 → 结账时怎么提示？
   - 图片全部删除后能否保存？
   - 卖家删除商品后已创建的订单还能查看详情吗？
```

### 验收清单直接复用 PRD 第 10 节

---

## 附录 · 目录结构最终形态

```
second-market/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.ts                 # 应用入口（含 runSeed）
│   ├── style.css               # Tailwind 指令
│   ├── App.vue                 # <router-view /> 容器
│   ├── db/
│   │   ├── index.ts            # Dexie 9 表 schema
│   │   ├── seed.ts             # 首次启动数据注入
│   │   └── types.ts            # TypeScript interface
│   ├── stores/
│   │   ├── role.ts             # 角色 + 视角
│   │   ├── user.ts             # 当前用户 + 余额
│   │   └── cart.ts             # 购物车（含 checkout）
│   ├── router/
│   │   └── index.ts            # 路由表 + beforeEach
│   ├── utils/
│   │   ├── imageCompress.ts    # Canvas 压缩
│   │   ├── orderNo.ts          # 订单号生成
│   │   ├── balance.ts          # 余额操作
│   │   └── backup.ts           # JSON 导出/导入
│   ├── components/
│   │   ├── RoleSwitcher.vue
│   │   ├── ViewSwitcher.vue
│   │   ├── TopBar.vue
│   │   ├── CategoryTabs.vue
│   │   ├── ProductCard.vue
│   │   ├── ImageUploader.vue
│   │   ├── AddressSelector.vue
│   │   ├── OrderStatusTag.vue
│   │   ├── EmptyState.vue
│   │   └── RefundApply.vue
│   ├── views/
│   │   ├── buyer/
│   │   │   ├── HomePage.vue
│   │   │   ├── ProductDetail.vue
│   │   │   ├── CartPage.vue
│   │   │   ├── CheckoutConfirm.vue
│   │   │   ├── OrderList.vue
│   │   │   ├── OrderDetail.vue
│   │   │   ├── PublishProduct.vue
│   │   │   └── MerchantShopHome.vue
│   │   ├── seller/
│   │   │   ├── ProductManage.vue
│   │   │   └── OrderManage.vue
│   │   ├── merchant/
│   │   │   ├── MerchantHome.vue
│   │   │   ├── MerchantProducts.vue
│   │   │   ├── MerchantOrders.vue
│   │   │   └── MerchantSettings.vue
│   │   └── admin/
│   │       ├── AdminLayout.vue
│   │       ├── Dashboard.vue
│   │       ├── ProductAudit.vue
│   │       ├── UserManage.vue
│   │       ├── MerchantAudit.vue
│   │       ├── OrderManage.vue
│   │       ├── CategoryManage.vue
│   │       ├── RefundManage.vue
│   │       └── SystemSettings.vue
│   └── assets/                  # Element Plus / Tailwind 默认产物
```

---

## 风险与注意事项（全阶段适用）

| # | 风险 | 应对 |
|---|------|------|
| 1 | **Dexie 事务处理 Blob 大小限制** | 实际测：单笔事务 > 几十张 Blob 可能失败。V1 seed 控制图片数量，退款审核/订单创建不涉及批量 Blob 写入，风险可控 |
| 2 | **Pinia 刷新后状态丢失** | Pinia 默认不持久化。userStore / roleStore 在刷新时从 IndexedDB 重新加载；cartStore 在 App.vue `onMounted` 调 `initialize()` |
| 3 | **图片 object URL 内存泄漏** | 每个使用图片的组件必须 `onUnmounted → URL.revokeObjectURL()`，写一个 `useBlobUrl(blob)` composable 自动处理 |
| 4 | **路由守卫循环** | 重定向 `/` 要确认首页路由的 `requiredRoles: ['any']`，否则会死循环 |
| 5 | **中文路径 Windows 环境** | `npm create vite` 在中文路径可能报错。**已在英文目录 `c:\Users\admin\Desktop\寻沫\second-market` 下执行**，无此问题 |
| 6 | **Element Plus + Tailwind 样式冲突** | Tailwind 的 preflight 可能覆盖 Element Plus 按钮/输入框默认样式。**Element Plus 的 CSS 引入要在 Tailwind 之后**（main.ts 最后引入 ElementPlus 的 `style.css`） |
| 7 | **首次启动 seed 数据的 Blob 图片生成** | seed 数据里的商品图片不能用 Blob（代码里没法硬编码 Blob）→ 用**网络图片 URL 转 Blob** 或 **Canvas 生成纯色占位图**。**推荐：首次启动自动生成 30 张不同颜色的占位图作为 seed 商品的 images** |

---

*（DEVPLAN 完）*  
**下一步**：审阅 DEVPLAN.md，确认后执行 `cd second-market && npm create vite...` 开始 Stage 0。遇到任何阶段 Gate 不过的情况 → 暂停 → 回到 DEVPLAN 对应阶段排查。
