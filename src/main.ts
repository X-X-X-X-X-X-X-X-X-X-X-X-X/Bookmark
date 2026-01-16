import "./assets/base.css";

import {createApp} from 'vue'
import App from './App.vue'
import {router} from "@/router/router";
import {createPinia} from 'pinia'
import {fixBrowserZoom, initAppData, initI18n, initStore, registerMouseRightClickEvent} from "@/util/appUtil";
import {i18n} from "@/i18n/i18n";
import {registerWindowKeyEvent} from "@/util/useWindowKeyEvent";


async function boot() {
  const app = createApp(App);
  app.use(router)
  app.use(createPinia())
  app.use(i18n);
  // ...
  fixBrowserZoom();
  initStore();
  initAppData(app);
  initI18n();
  // 注册全局键盘事件
  registerWindowKeyEvent();
  registerMouseRightClickEvent();
  const meta = document.createElement('meta')
  meta.name = 'naive-ui-style'
  document.head.appendChild(meta)
  app.mount('#app');
}

boot();