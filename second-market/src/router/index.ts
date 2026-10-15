// ========== 完整路由表 + 角色守卫 ==========
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

// 懒加载视图
const HomePage       = () => import('@/views/buyer/HomePage.vue')
const ProductDetail  = () => import('@/views/buyer/ProductDetail.vue')
const CartPage       = () => import('@/views/buyer/CartPage.vue')
const OrderList      = () => import('@/views/buyer/OrderList.vue')
const Checkout       = () => import('@/views/buyer/CheckoutConfirm.vue')
const PublishProduct = () => import('@/views/buyer/PublishProduct.vue')
const ProfilePage    = () => import('@/views/buyer/ProfilePage.vue')
const MerchantShop   = () => import('@/views/buyer/MerchantShopHome.vue')

const SellerProducts = () => import('@/views/seller/ProductManage.vue')
const SellerOrders   = () => import('@/views/seller/OrderManage.vue')

const MerchantHome      = () => import('@/views/merchant/MerchantHome.vue')
const MerchantProducts  = () => import('@/views/merchant/MerchantProducts.vue')
const MerchantOrders    = () => import('@/views/merchant/MerchantOrders.vue')
const MerchantSettings  = () => import('@/views/merchant/MerchantSettings.vue')

const AdminLayout       = () => import('@/views/admin/AdminLayout.vue')
const AdminDashboard    = () => import('@/views/admin/Dashboard.vue')
const AdminProductAudit = () => import('@/views/admin/ProductAudit.vue')
const AdminUserManage   = () => import('@/views/admin/UserManage.vue')
const AdminMerchantAudit = () => import('@/views/admin/MerchantAudit.vue')
const AdminOrderManage  = () => import('@/views/admin/OrderManage.vue')
const AdminCategory     = () => import('@/views/admin/CategoryManage.vue')
const AdminRefunds      = () => import('@/views/admin/RefundManage.vue')
const AdminSettings     = () => import('@/views/admin/SystemSettings.vue')

const routes: RouteRecordRaw[] = [
  // ========== 买家端 ==========
  { path: '/',             component: HomePage,            meta: { requiredRoles: ['any'] } },
  { path: '/product/:id',  component: ProductDetail,       meta: { requiredRoles: ['any'] } },
  { path: '/cart',         component: CartPage,            meta: { requiredRoles: ['buyer', 'any'] } },
  { path: '/orders',       component: OrderList,           meta: { requiredRoles: ['buyer', 'any'] } },
  { path: '/checkout',     component: Checkout,            meta: { requiredRoles: ['buyer', 'any'] } },
  { path: '/publish',      component: PublishProduct,      meta: { requiredRoles: ['buyer', 'seller', 'any'] } },
  { path: '/profile',      component: ProfilePage,         meta: { requiredRoles: ['any'] } },
  { path: '/merchant/:id', component: MerchantShop,        meta: { requiredRoles: ['any'] } },

  // ========== 卖家端 ==========
  { path: '/seller/products', component: SellerProducts, meta: { requiredRoles: ['seller', 'merchant', 'admin'] } },
  { path: '/seller/orders',   component: SellerOrders,   meta: { requiredRoles: ['seller', 'merchant', 'admin'] } },

  // ========== 商家端 ==========
  { path: '/merchant-dashboard',   component: MerchantHome,     meta: { requiredRoles: ['merchant', 'admin'] } },
  { path: '/merchant-products',    component: MerchantProducts, meta: { requiredRoles: ['merchant', 'admin'] } },
  { path: '/merchant-orders',       component: MerchantOrders,   meta: { requiredRoles: ['merchant', 'admin'] } },
  { path: '/merchant-settings',     component: MerchantSettings, meta: { requiredRoles: ['merchant', 'admin'] } },

  // ========== 管理后台（独立 Layout） ==========
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiredRoles: ['admin'] },
    children: [
      { path: '',           component: AdminDashboard,    meta: { requiredRoles: ['admin'] } },
      { path: 'products',   component: AdminProductAudit, meta: { requiredRoles: ['admin'] } },
      { path: 'users',      component: AdminUserManage,   meta: { requiredRoles: ['admin'] } },
      { path: 'merchants',  component: AdminMerchantAudit, meta: { requiredRoles: ['admin'] } },
      { path: 'orders',     component: AdminOrderManage,  meta: { requiredRoles: ['admin'] } },
      { path: 'categories', component: AdminCategory,     meta: { requiredRoles: ['admin'] } },
      { path: 'refunds',    component: AdminRefunds,      meta: { requiredRoles: ['admin'] } },
      { path: 'settings',   component: AdminSettings,     meta: { requiredRoles: ['admin'] } }
    ]
  },

  // 404 回首页
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// ========== 路由守卫 ==========
// 本地 demo 策略：所有路由放行，角色权限由顶栏 RoleSwitcher 控制
// 真实生产环境应在此加 useRoleStore().currentRole 检查
router.beforeEach(() => true)

export default router
