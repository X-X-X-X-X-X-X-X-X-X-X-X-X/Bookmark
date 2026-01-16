<script setup lang="ts">
import folderImg from "@/assets/folder.png";
import { allBookmark, useAppData } from "@/util/useAppData";
import { useSettingStore } from "@/store/settingStore";
import { computed, inject, onMounted, reactive } from "vue";
import { contentMaxHeightAndWidth } from "@/util/style";
import Sortable, { type SortableEvent } from "sortablejs";
import { useTreeNodeHover } from "@/util/useTreeNodeHover";
import { useContextMenu } from "@/view/BookmarkList/components/contextMenu/useContextMenu";
import { every } from "@/util/appUtil";
import type { TreeNode } from "../../../../types";
import { PROVIDE_LAYOUT_CONTEXT_MENU_FUNCTION_SET, SEPARATOR } from "@/util/constants";
import { useI18n } from "vue-i18n";
import debounce from "debounce";
import { useConfirmDialog } from "@/view/BookmarkList/components/dialog/useDialog";

let {
  data,
  clickBookmark,
  selectStatus,
  inSelectNodeIdx,
  cutNodes,
  getLastNode,
  isSpecialTreeNode,
  isInSelectNode,
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
let i18n = useI18n();

const itemClick = (item: TreeNode) => {
  if (selectStatus()) {
    let idx = inSelectNodeIdx(item);
    if (idx === -1) {
      data.selectNodes.push(item);
    } else {
      data.selectNodes.splice(idx, 1);
    }
  } else {
    clickBookmark(item);
  }
}

let dropFolderData = reactive({
  inDrag: false,
  srcDragItem: undefined as TreeNode | undefined,
  dragEnterItem: undefined as TreeNode | undefined,
  canDrop: false
})

const setDropTimer = debounce(() => {
  if (!dropFolderData.inDrag) return;
  if (dropFolderData.srcDragItem?.title === SEPARATOR) return;
  if (dropFolderData.srcDragItem?.id === dropFolderData.dragEnterItem?.id) return;
  if (dropFolderData.dragEnterItem && !dropFolderData.dragEnterItem.url && dropFolderData.dragEnterItem.title !== SEPARATOR) {
    dropFolderData.dragEnterItem.canDrop = true;
    dropFolderData.canDrop = true;
  }
}, 300)


const clearDropTimer = () => {
  dropFolderData.canDrop = false;
  data.bookmarkTree.forEach(v => v.canDrop = false);
}


const dragEnterAndLeave = (e: DragEvent, item: TreeNode, type: "enter" | "leave") => {
  if (item.id === dropFolderData.srcDragItem?.id) return;
  if (type === 'enter') {
    setDropTimer();
    dropFolderData.dragEnterItem = item;
  } else {
    if (item.id === dropFolderData.dragEnterItem?.id) {
      clearDropTimer();
      dropFolderData.dragEnterItem = undefined;
    }
  }
}

onMounted(() => {
  let sortList = getSortList();
  let tempHoverTime = 0;
  Sortable.create(sortList!, {
    // animation: 50,
    draggable: ".drag",
    swapThreshold: 0.80,
    //设置拖拽缓冲区
    invertSwap: true,
    onStart(evt) {
      dropFolderData.inDrag = true;
      dropFolderData.srcDragItem = data.bookmarkTree[evt.oldIndex!]
      dropFolderData.srcDragItem.active = true;
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
      if (dropFolderData.canDrop) {
        let idx = data.bookmarkTree.findIndex(v => v.id === dropFolderData.srcDragItem?.id);
        if (idx !== -1) {
          let dragFrom = data.bookmarkTree.splice(idx, 1)[0];
          await chrome.bookmarks.move(dragFrom.id, {
            parentId: dropFolderData.dragEnterItem?.id
          })
        }
      }
      dropFolderData.srcDragItem!.active = false;
      clearDropTimer();
      settingStore.hoverEnterFolderMs = tempHoverTime;
      dropFolderData.inDrag = false;
    }
  });

  let currentVersion = chrome.runtime.getManifest().version;
  if (settingStore.version !== currentVersion && settingStore.version !== "") {
    dialog.create({
      hiddenCancel: true,
      content: (props, ctx) => i18n.t("updateTips", {
        v: currentVersion
      }),
    })
  }
  settingStore.version = currentVersion;
})

const backOpen = (e: MouseEvent, item: TreeNode) => {
  if (e.button === 1 && settingStore.middleMouseBackgroundOpen) {
    e.preventDefault();
    clickBookmark(item, false);
  }
}

let contextMenu = useContextMenu();
let dialog = useConfirmDialog();

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
  title.push(allBookmark[item.id]?.fullPath?.map(v => {
    if (v.id === "0") {
      return i18n.t("rootTitle");
    }
    return v.title;
  }).join('-')!);
  return title.join("\n");
}
</script>
<template>
  <div v-if="data.bookmarkTree.length === 0" class=" font-bold flex justify-center items-center"
    :class="[settingStore.fixedHeight ? 'top-1/2 -translate-y-1/2 absolute' : 'h-16']" :style="minWidthStyle"
    @contextmenu="contextMenu.createContextMenu($event, getLastNode(), true)">
    {{ $t("emptyMessage") }}
  </div>
  <div id="sortList" class="flex-col flex-wrap h-full w-max content-start"
    :class="[settingStore.displayMode === 'h' ? 'flex' : 'overflow-x-hidden overflow-y-auto']"
    :style="[settingStore.displayMode === 'h' ? minWidthStyle : widthStyle, contentMaxHeightAndWidth]"
    @contextmenu="contextMenu.createContextMenu($event, getLastNode(), true)">
    <div class="w-full flex items-center border h-8 px-2 cursor-pointer whitespace-nowrap"
      @mouseenter="hoverEnterEvent(item)" @mouseleave="hoverLeaveEvent" @mousedown="backOpen($event, item)"
      @contextmenu="createContextMenu($event, item)" :class="[
        /*因为所有节点公用一个SortAble，所以只能以这种动态类名形式控制*/
        every(
          //不是根节点
          getLastNode().id !== '0',
          //不是特殊节点
          !isSpecialTreeNode(getLastNode().id),
          // 没有多选
          !selectStatus()
        ) ? 'drag' : '',
        // 右键/多选当前高亮
        (item.active || isInSelectNode(item)) ? 'hover-active' : '',
        cutNodes.find(v => v.id === item.id) ? 'border-dashed opacity-50' : '!border-transparent',
        `_bid_${item.id}`,
        dropFolderData.inDrag ? 'drag-cover' : 'hover-color',
        item.canDrop ? '!can-drop' : ''
      ]" :style="widthStyle" :title="itemTitle(item)" @dragenter="dragEnterAndLeave($event, item, 'enter')"
      @dragleave="dragEnterAndLeave($event, item, 'leave')" v-for="item in data.bookmarkTree"
      @click="itemClick(item), hoverLeaveEvent()" :key="item.id + item.type">
      <template v-if="!item.isSeparator">
        <div class="w-4 h-4 flex items-center mr-1">
          <template v-if="!item.url">
            <svg t="1750727008231" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
              p-id="6352">
              <path
                d="M855.04 385.024q19.456 2.048 38.912 10.24t33.792 23.04 21.504 37.376 2.048 54.272q-2.048 8.192-8.192 40.448t-14.336 74.24-18.432 86.528-19.456 76.288q-5.12 18.432-14.848 37.888t-25.088 35.328-36.864 26.112-51.2 10.24l-567.296 0q-21.504 0-44.544-9.216t-42.496-26.112-31.744-40.96-12.288-53.76l0-439.296q0-62.464 33.792-97.792t95.232-35.328l503.808 0q22.528 0 46.592 8.704t43.52 24.064 31.744 35.84 12.288 44.032l0 11.264-53.248 0q-40.96 0-95.744-0.512t-116.736-0.512-115.712-0.512-92.672-0.512l-47.104 0q-26.624 0-41.472 16.896t-23.04 44.544q-8.192 29.696-18.432 62.976t-18.432 61.952q-10.24 33.792-20.48 65.536-2.048 8.192-2.048 13.312 0 17.408 11.776 29.184t29.184 11.776q31.744 0 43.008-39.936l54.272-198.656q133.12 1.024 243.712 1.024l286.72 0z"
                p-id="6353" fill="#F5A623"></path>
            </svg>
          </template>
          <template v-else>
            <img loading="lazy" :src="faviconURL(item.url ?? '')" alt="" class="w-4">
          </template>
        </div>
        <div class="overflow-hidden w-full leading-none py-1 overflow-ellipsis">
          <span class="font-bold" v-if="item.count !== undefined">
            {{ item.count }}
          </span>
          {{ item.title }}
        </div>
      </template>
      <template v-else>
        <div class="w-full h-0 border-b"></div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.drag-cover {
  position: relative;
}

.drag-cover::before {
  content: "";
  display: block;
  position: absolute;
  z-index: 10;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}
</style>