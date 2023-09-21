<template>
  <n-config-provider :theme="theme">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <keep-alive>
          <component :is="Component"/>
        </keep-alive>
      </transition>
    </router-view>
  </n-config-provider>
</template>


<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 150ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
<script setup lang="ts">
import {darkTheme, NConfigProvider, useOsTheme} from "naive-ui";
import {computed, provide, reactive, ref, toRefs, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useSettingStore} from "@/store/settingStore";
import {DEFAULT_START_KEY, PROVIDE_APP_DATA_KEY, PROVIDE_IS_INITIALIZED} from "@/util/constants";
import type {AppData} from "../types";
import {storageGet} from "@/util/storage";
import {useAppData} from "@/util/useAppData";

let osTheme = useOsTheme();
let theme = computed(() => osTheme.value === "dark" ? darkTheme : null);
let settingStore = useSettingStore();
/*i18n*/
let {locale, t} = useI18n({useScope: "global"});
let {language} = toRefs(settingStore);
watch(language, (i: any) => {
  locale.value = i;
}, {
  immediate: true
});
/*提供应用数据*/
let data = reactive<AppData>({
  bookmarkTree: [],
  navigator: [],
})
let mounted = ref(false);
provide(PROVIDE_IS_INITIALIZED, mounted);
provide(PROVIDE_APP_DATA_KEY, data);
chrome.bookmarks.getTree(all => {
  all[0] = reactive(Object.assign(all[0], {
    title: computed(() => t("rootTitle"))
  }))
  data.navigator.push(all[0]);
  let defaultStartNode = storageGet(DEFAULT_START_KEY);
  if (defaultStartNode) {
    data.navigator.push(defaultStartNode);
  }
  useAppData(data).clickLastNode();
  mounted.value = true;
})
</script>