<script setup lang="ts">
import folderImg from "@/assets/folder.png";
import {useAppData} from "@/util/useAppData";
import {useSettingStore} from "@/store/settingStore";
import {computed, onMounted} from "vue";
import {contentMaxHeight} from "@/util/style";
import Sortable, {type SortableEvent} from "sortablejs";
import {useTreeNodeHover} from "@/util/useTreeNodeHover";
import {useContextMenu} from "@/view/BookmarkList/components/contextMenu/useContextMenu";

let {data, clickBookmark, cutNode} = useAppData();

function faviconURL(u: string) {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', u);
  url.searchParams.set('size', '32');
  return url.toString();
}

let settingStore = useSettingStore();

let {
  hoverEnterEvent,
  hoverLeaveEvent
} = useTreeNodeHover();

const minWidthStyle = computed(() => `min-width: ${settingStore.columnWidth}rem`);
const widthStyle = computed(() => `width: ${settingStore.columnWidth}rem`);

onMounted(() => {
  let list = document.getElementById("sortList");
  let tempHoverTime = 0;
  Sortable.create(list!, {
    animation: 150,
    draggable: ".drag",
    onStart() {
      tempHoverTime = settingStore.hoverEnterFolderMs;
      settingStore.hoverEnterFolderMs = 0;
    },
    onEnd: async function (/**Event*/evt: SortableEvent) {
      if (evt.oldDraggableIndex !== undefined && evt.newDraggableIndex !== undefined && evt.newDraggableIndex !== evt.oldDraggableIndex) {
        let treeNode = data.bookmarkTree[evt.oldDraggableIndex];
        let offsetIdx = 0;
        let old = data.bookmarkTree.splice(evt.oldDraggableIndex, 1);
        data.bookmarkTree.splice(evt.newDraggableIndex, 0, ...old);
        if (evt.oldDraggableIndex < evt.newDraggableIndex) {
          ++offsetIdx;
        }
        await chrome.bookmarks.move(treeNode.id, {
          index: evt.newDraggableIndex + offsetIdx,
          parentId: treeNode.parentId
        })
      }
      settingStore.hoverEnterFolderMs = tempHoverTime;
    },
  });
})


let contextMenu = useContextMenu();
</script>
<template>
  <div
      v-if="data.bookmarkTree.length === 0"
      class=" font-bold flex justify-center items-center"
      :class="[settingStore.fixedHeight ? 'top-1/2 -translate-y-1/2 absolute' : 'py-8']"
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
        class="hover-color w-full flex items-center border h-8 px-2 cursor-pointer whitespace-nowrap"
        @mouseenter="hoverEnterEvent(item)"
        @mouseleave="hoverLeaveEvent"
        @contextmenu="contextMenu.createContextMenu($event, item)"
        :class="[
            data.navigator[data.navigator.length - 1].id !== '0' ? 'drag' : '',
            item.active ? 'hover-active' : '',
            cutNode?.id === item.id ? 'border-dashed' : 'border-transparent'
        ]"
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