<template>
  <n-config-provider :theme="theme" :locale="naiveLocale" :theme-overrides="themeOverrides">
    <ConfirmDialog>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <keep-alive>
            <component :is="Component"/>
          </keep-alive>
        </transition>
      </router-view>
    </ConfirmDialog>
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
import ConfirmDialog from "@/view/BookmarkList/components/dialog/ConfirmDialog.vue";
import {NConfigProvider, NDialogProvider} from "naive-ui";
import {computed, provide, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {DEFAULT_START_KEY, PROVIDE_APP_DATA_KEY, PROVIDE_IS_INITIALIZED} from "@/util/constants";
import type {AppData} from "../types";
import {storageGet} from "@/util/storage";
import {useAppData} from "@/util/useAppData";
import {useNaiveUI} from "@/util/useNaiveUI";
import {initI18n} from "@/util/appUtil";

let {themeOverrides, theme, naiveLocale} = useNaiveUI();
initI18n();
let i18n = useI18n();
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
    title: computed(() => i18n.t("rootTitle"))
  }))
  data.navigator.push(all[0]);
  let defaultStartNode = storageGet(DEFAULT_START_KEY);
  if (defaultStartNode) {
    data.navigator.push(defaultStartNode);
  }
  //首次点击。确定宽度
  useAppData(data, i18n).clickLastNode();
  mounted.value = true;
})

</script>