<script setup lang="ts">
import folderImg from "@/assets/folder.png";
import {allBookmark, useAppData} from "@/util/useAppData";
import {useSettingStore} from "@/store/settingStore";
import {computed, inject, onMounted} from "vue";
import {contentMaxHeightAndWidth} from "@/util/style";
import Sortable, {type SortableEvent} from "sortablejs";
import {useTreeNodeHover} from "@/util/useTreeNodeHover";
import {useContextMenu} from "@/view/BookmarkList/components/contextMenu/useContextMenu";
import {every, makeLimitFun} from "@/util/appUtil";
import type {TreeNode} from "../../../../types";
import {LAST_POSITION_X, LAST_POSITION_Y, PROVIDE_LAYOUT_CONTEXT_MENU_FUNCTION_SET} from "@/util/constants";
import {storageSet} from "@/util/storage";
import {useI18n} from "vue-i18n";

let {
  data,
  clickBookmark,
  cutNode,
  getLastNode,
  isSpecialTreeNode,
  getSpecialTreeNodeKey,
} = useAppData();

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

const getSortList = () => document.getElementById("sortList");

const registerSavePosition = () => {
  const limitTime = 100;
  window.onscroll = makeLimitFun(() => {
    storageSet(LAST_POSITION_X, window.scrollX);
  }, limitTime)
  let sortList = getSortList()!;
  sortList.onscroll = makeLimitFun(() => {
    storageSet(LAST_POSITION_Y, sortList.scrollTop);
  }, limitTime)
}

let i18n = useI18n();

onMounted(() => {
  // registerSavePosition();
  let sortList = getSortList();
  // todo window.scrollTo不会生效setTimeOut大概125ms左右才会触发...做返回上次滚动位置不会太完美，暂时放弃，无优化方向
  // if (settingStore.backLastPath) {
  //   let x = storageGet(LAST_POSITION_X);
  //   let y = storageGet(LAST_POSITION_Y);
  //   let sortList = document.querySelector("#sortList");
  //   sortList?.scrollTo(0, y);
  //   window.scrollTo(x, 0);
  // }
  let tempHoverTime = 0;
  Sortable.create(sortList!, {
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
    }
  });
})

const backOpen = (e: MouseEvent, item: TreeNode) => {
  if (e.button === 1 && settingStore.middleMouseBackgroundOpen) {
    e.preventDefault();
    clickBookmark(item, false);
  }
}

let contextMenu = useContextMenu();

const createContextMenu = (e: MouseEvent, item: TreeNode) => {
  let lastNode = getLastNode();
  let specialTreeNodeKey = getSpecialTreeNodeKey(lastNode.id);
  if (specialTreeNodeKey) {
    contextMenu.createSpecialContextMenu(e, item, specialTreeNodeKey!)
  } else {
    contextMenu.createContextMenu(e, item)
  }
}

// LAYOUT组件空白右键菜单
inject<Function>(PROVIDE_LAYOUT_CONTEXT_MENU_FUNCTION_SET)?.((ev: MouseEvent) => {
  contextMenu.createContextMenu(ev, getLastNode(), true)
})

const itemTitle = (item: TreeNode) => {
  let title = [item.title];
  item.url && title.push(item.url);
  title.push(allBookmark[item.id].fullPath?.map(v => {
    if (v.id === "0") {
      return i18n.t("rootTitle");
    }
    return v.title;
  }).join('-')!);
  return title.join("\n");
}
</script>
<template>
  <div
      v-if="data.bookmarkTree.length === 0"
      class=" font-bold flex justify-center items-center"
      :class="[settingStore.fixedHeight ? 'top-1/2 -translate-y-1/2 absolute' : 'h-16']"
      :style="minWidthStyle"
      @contextmenu="contextMenu.createContextMenu($event, getLastNode(), true)"
  >
    {{ $t("emptyMessage") }}
  </div>
  <div
      id="sortList"
      class="flex-col flex-wrap h-full w-max content-start"
      :class="[settingStore.displayMode === 'h' ? 'flex' : 'overflow-x-hidden overflow-y-auto']"
      :style="[settingStore.displayMode === 'h' ? minWidthStyle : widthStyle , contentMaxHeightAndWidth]"
      @contextmenu="contextMenu.createContextMenu($event, getLastNode(), true)"
  >
    <TransitionGroup
        name="list" tag="div"
        class="hover-color w-full flex items-center border h-8 px-2 cursor-pointer whitespace-nowrap"
        @mouseenter="hoverEnterEvent(item)"
        @mouseleave="hoverLeaveEvent"
        @mousedown="backOpen($event, item)"
        @contextmenu="createContextMenu($event, item)"
        :class="[
            /*因为所有节点公用一个SortAble，所以只能以这种动态类名形式控制*/
            every(
              //不是根节点
              getLastNode().id !== '0',
              //不是特殊节点
              !isSpecialTreeNode(getLastNode().id)
            ) ? 'drag' : '',
            item.active ? 'hover-active' : '',
            cutNode?.id === item.id ? 'border-dashed' : '!border-transparent',
            `_bid_${item.id}`
        ]"
        :style="widthStyle"
        :title="itemTitle(item)"
        v-for="item in data.bookmarkTree" @click="clickBookmark(item), hoverLeaveEvent()" :key="item.id + item.type">
      <div class="w-4 h-4 flex items-center mr-1">
        <img
            :src="item.url ? faviconURL(item.url??'') : folderImg"
            alt=""
            class="w-4"
        >
      </div>
      <div class="overflow-hidden w-full leading-none py-1 overflow-ellipsis">
        <span class="font-bold" v-if="item.count !== undefined">
          {{ item.count }}
        </span>
        {{ item.title }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.list-move, /* 对移动中的元素应用的过渡 */
.list-enter-active,
.list-leave-active {
  transition: all 0.05s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 确保将离开的元素从布局流中删除
  以便能够正确地计算移动的动画。 */
.list-leave-active {
  position: absolute;
}
</style>