<script setup lang="ts">
import folderImg from "@/assets/folder.png";
import {useAppData} from "@/util/useAppData";
import {useSettingStore} from "@/store/settingStore";
import type {TreeNode} from "../../../../types";
import {computed, onMounted} from "vue";
import {contentMaxHeight} from "@/util/style";
import Sortable, {type SortableEvent} from "sortablejs";

let {data, clickBookmark} = useAppData();

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


onMounted(() => {
  let list = document.getElementById("sortList");
  Sortable.create(list!, {
    animation: 150,
    // Element dragging ended
    onEnd: async function (/**Event*/evt: SortableEvent) {
      if (evt.oldDraggableIndex !== undefined && evt.newDraggableIndex !== undefined) {
        let treeNode = data.bookmarkTree[evt.oldDraggableIndex];
        await chrome.bookmarks.move(treeNode.id, {
          index: evt.newDraggableIndex + 1,
          parentId: treeNode.parentId
        })

        if (evt.oldDraggableIndex > evt.newDraggableIndex) {
          let old = data.bookmarkTree.splice(evt.oldDraggableIndex, 1);
          data.bookmarkTree.splice(evt.newDraggableIndex - 1, 0, ...old);
        } else {

        }
      }
      // var itemEl = evt.item;  // dragged HTMLElement
      // evt.to;    // target list
      // evt.from;  // previous list
      // evt.oldIndex;  // element's old index within old parent
      // evt.newIndex;  // element's new index within new parent
      // evt.oldDraggableIndex; // element's old index within old parent, only counting draggable elements
      // evt.newDraggableIndex; // element's new index within new parent, only counting draggable elements
      // evt.clone // the clone element
      // evt.pullMode;  // when item is in another sortable: `"clone"` if cloning, `true` if moving
    },
  });
})
</script>
<template>
  <div
      v-if="data.bookmarkTree.length === 0"
      class="top-1/2 -translate-y-1/2 font-bold absolute flex justify-center items-center"
      :style="minWidthStyle"
  >
    {{ $t("emptyMessage") }}
  </div>
  <div
      id="sortList"
      class="flex-col flex-wrap h-full  w-max"
      :class="[settingStore.displayMode === 'h' ? 'flex' : 'overflow-x-hidden overflow-y-auto']"
      :style="[settingStore.displayMode === 'h' ? minWidthStyle : widthStyle , contentMaxHeight]">
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