<script setup lang="ts">
import type {TreeNode} from "../../../../types";
import {setAsStart, useAppData} from "@/util/useAppData";
import {useMessage} from "@/util/useMessage";
import {useI18n} from "vue-i18n";
import {useTreeNodeHover} from "@/util/useTreeNodeHover";
import {useContextMenu} from "@/view/BookmarkList/components/contextMenu/useContextMenu";
import {useSettingStore} from "@/store/settingStore";

let {data, clickBookmark, getLastNode} = useAppData();
let message = useMessage();
let {t} = useI18n();

let store = useSettingStore();

const navigatorTo = (node: TreeNode) => {
  if(data.selectNodes.length > 0) return;
  //设为默认目录
  if (!store.backLastPath && node.id === getLastNode().id) {
    setAsStart(data.navigator, data.bookmarkTree).then(r => {
      if (r) {
        message?.(t("setDefaultStartMessage", {
          msg: node.title
        }))
      }
    })
  } else {
    let index = data.navigator.findIndex(v => v.id === node.id);
    index === 0 ? index = 1 : null;
    data.navigator.splice(index);
    clickBookmark(node);
  }
}

let {
  hoverEnterEvent,
  hoverLeaveEvent
} = useTreeNodeHover();

let contextMenu = useContextMenu();
</script>

<template>
  <div
      class="font-bold justify-end flex whitespace-nowrap w-full h-full">
    <div
        class="cursor-pointer px-2 h-full flex-1 border-r last:border-r-0 hover-color leading-8 text-center"
        v-for="item in data.navigator"
        @mouseenter="hoverEnterEvent(item, true)"
        @mouseleave="hoverLeaveEvent"
        @contextmenu="contextMenu.createContextMenu($event, item, true)"
        @click="navigatorTo(item)">
      {{ item.title }}
    </div>
  </div>
</template>

<style scoped>

</style>