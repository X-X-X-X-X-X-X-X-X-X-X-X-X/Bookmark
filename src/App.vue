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
import {computed, reactive} from "vue";
import {DEFAULT_START_KEY} from "@/util/constants";
import {storageGet} from "@/util/storage";
import {getTree, setAllBookmark, useAppData} from "@/util/useAppData";
import {useNaiveUI} from "@/util/useNaiveUI";
import {i18n} from "@/i18n/i18n";
import {multipleSelectListener} from "@/util/mutipleSelectEvent";
import {useWindowKeyEvent} from "@/util/useWindowKeyEvent";

let {themeOverrides, theme, naiveLocale} = useNaiveUI();
let {data, updateNode, clickLastNode} = useAppData();
// 注册多选事件
useWindowKeyEvent().addListener(multipleSelectListener())

getTree().then(all => {
  setAllBookmark(all);
  all[0] = reactive(Object.assign(all[0], {
    title: computed(() => i18n.global.t("rootTitle"))
  }))
  // fix 起始目录包含所有书签，localStorage体积剧增
  delete all[0].children;
  data.navigator.push(all[0]);
  let defaultStartNode = storageGet(DEFAULT_START_KEY);
  if (defaultStartNode) {
    //兼容老版本
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
  //首次点击确定宽度
  clickLastNode();
  data.init = true;
})
</script>