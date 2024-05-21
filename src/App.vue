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
import {NConfigProvider} from "naive-ui";
import {computed, provide, reactive, ref} from "vue";
import {useI18n} from "vue-i18n";
import {DEFAULT_START_KEY, PROVIDE_APP_DATA_KEY, PROVIDE_IS_INITIALIZED} from "@/util/constants";
import type {AppData} from "../types";
import {storageGet} from "@/util/storage";
import {getTree, setAllBookmark, useAppData} from "@/util/useAppData";
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
getTree().then(all => {
  setAllBookmark(all);
  all[0] = reactive(Object.assign(all[0], {
    title: computed(() => i18n.t("rootTitle"))
  }))
  data.navigator.push(all[0]);
  let defaultStartNode = storageGet(DEFAULT_START_KEY);
  let {clickLastNode, updateNode} = useAppData(data, i18n);
  if (defaultStartNode) {
    //兼容老版本。。。。。
    if (Array.isArray(defaultStartNode)) {
      data.navigator.splice(1);
      defaultStartNode.splice(0, 1);
      defaultStartNode.forEach((v, k) => {
        defaultStartNode[k] = updateNode(v);
      });
      data.navigator.push(...defaultStartNode);
    } else {
      data.navigator.push(updateNode(defaultStartNode));
    }
  }
  //首次点击。确定宽度
  clickLastNode();
  mounted.value = true;
})
</script>