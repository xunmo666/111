import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import router from './router'
import { runSeed } from './db/seed'
import App from './App.vue'
import './style.css'

async function bootstrap() {
  // 1. 首次启动时注入 seed 数据（幂等）
  await runSeed()

  // 2. 创建应用
  const app = createApp(App)

  // 3. 注册 Element Plus 全部图标
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component as any)
  }

  // 4. 安装插件
  app.use(createPinia())
  app.use(router)
  app.use(ElementPlus)

  // 5. 挂载
  app.mount('#app')
}

bootstrap()
