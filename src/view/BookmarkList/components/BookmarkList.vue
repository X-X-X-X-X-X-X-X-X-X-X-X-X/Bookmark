<script setup lang="ts">
import folderImg from "@/assets/folder.png";
import {useAppData} from "@/util/useAppData";
import {useSettingStore} from "@/store/settingStore";
import type {TreeNode} from "../../../../types";
import {NBadge} from "naive-ui";
import {computed, onMounted, ref} from "vue";

let {data, clickBookmark} = useAppData();
let emptyRef = ref(false);
onMounted(() => {
  emptyRef.value = true;
})

function faviconURL(u: string) {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', u);
  url.searchParams.set('size', '32');
  return url.toString();
}

let settingStore = useSettingStore();
let hoverTimer: number;
const hoverEnterEvent = (item: TreeNode) => {
  if (!item.url && settingStore.hoverEnterFolderMs > 0) {
    hoverTimer = setTimeout(() => {
      clickBookmark(item);
    }, settingStore.hoverEnterFolderMs);
  }
}
const hoverLeaveEvent = () => {
  clearTimeout(hoverTimer);
}
const minWidthStyle = computed(() => `min-width: ${settingStore.columnWidth}rem`);
const widthStyle = computed(() => `width: ${settingStore.columnWidth}rem`);

</script>
<template>
  <div
      v-if="data.bookmarkTree.length === 0 && emptyRef" class="h-32 font-bold flex justify-center items-center"
      :style="minWidthStyle"
  >
    {{ $t("emptyMessage") }}
  </div>
  <div class="flex-col flex-wrap h-full w-full contentMaxHeight"
       :class="[settingStore.displayMode === 'h' ? 'flex w-max' : 'overflow-x-hidden overflow-y-auto']"
       :style="settingStore.displayMode === 'h' ? minWidthStyle : widthStyle"
  >
    <div
        class="hover:bg-gray-100 dark:hover:bg-[#333] w-full flex items-center h-8 px-2 cursor-pointer whitespace-nowrap"
        @mouseenter="hoverEnterEvent(item)"
        @mouseleave="hoverLeaveEvent"
        :style="widthStyle"
        :title="item.title + (item.url ? '\n' + item.url : '')"
        v-for="item in data.bookmarkTree" @click="clickBookmark(item), hoverLeaveEvent()" :key="item.id">
      <img
          :src="item.url ? faviconURL(item.url??'') : folderImg"
          alt=""
          class="w-4 h-4 mr-1"
      >
      <div class="overflow-hidden w-full overflow-ellipsis">
        <span class="font-bold" v-if="item.count !== undefined">
          {{ item.count }}
        </span>
        {{ item.title }}
      </div>
    </div>
  </div>

</template>

<style scoped>

</style>