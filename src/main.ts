import "./assets/base.css";

import {createApp} from 'vue'
import App from './App.vue'
import {router} from "@/router/router";
import {createPinia} from 'pinia'
import {fixBrowserZoom, initStore, registerMouseRightClickEvent} from "@/util/appUtil";
import {i18n} from "@/i18n/i18n";


async function boot() {
    const app = createApp(App);
    app.use(router)
    app.use(createPinia())
    app.use(i18n);
    fixBrowserZoom();
    initStore();
    registerMouseRightClickEvent();
    const meta = document.createElement('meta')
    meta.name = 'naive-ui-style'
    document.head.appendChild(meta)
    app.mount('#app');
}

boot();