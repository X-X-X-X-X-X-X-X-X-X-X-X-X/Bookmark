<script setup lang="ts">
import { h, nextTick, onMounted, onUnmounted, reactive, ref, type Ref, type StyleValue } from "vue";
import type { TreeNode } from "../../../../../types";
import { createTab, every, myScrollTo, resizeMinHeight, resizeWidthContainer, some } from "@/util/appUtil";
import { useMessage } from "@/util/useMessage";
import { useConfirmDialog } from "@/view/BookmarkList/components/dialog/useDialog";
import {
  allBookmark,
  setAllBookmark,
  setAsStart,
  type SpecialTreeNodeKey,
  updateAllBookmark,
  useAppData
} from "@/util/useAppData";
import { useI18n } from "vue-i18n";
import { updateFrequentlyUsedBookmarks } from "@/util/storage";
import { useSettingStore } from "@/store/settingStore";
import InputDialogContent, {
  type InputContentValueType
} from "@/view/BookmarkList/components/dialog/InputDialogContent.vue";
import { SEPARATOR } from "@/util/constants";

const props = defineProps<{
  x: number,
  y: number,
  item: TreeNode,
  isBlank?: boolean,
  specialType?: SpecialTreeNodeKey
  isSeparator?: boolean
}>()

let { item, isBlank, specialType } = props;

let {
  clickLastNode,
  cut,
  cutNodes,
  paste,
  data,
  selectStatus,
  getLastNode,
  isInSelectNode,
  specialTreeNode
} = useAppData();
const updatePosition = () => {
  let contextMenu = document.getElementById("contextMenu")!;
  let { clientWidth, clientHeight } = document.body;
  let { offsetWidth, offsetHeight } = contextMenu;
  let x = props.x;
  let y = props.y;
  if (props.x + offsetWidth > clientWidth) {
    x = props.x - offsetWidth;
  }
  if (props.y + offsetHeight > clientHeight) {
    y = props.y - offsetHeight;
  }
  if (x < 0) {
    x = 0;
  }
  if (y < 0) {
    y = 0;
  }
  contextMenu.style.left = x + "px";
  contextMenu.style.top = y + "px";
}

onMounted(async () => {
  if (props.isSeparator) {
    let separatorMenu = menu.filter(v => v.belong === "separator");
    menu.length = 0;
    menu.push(...separatorMenu);
  }
  //特殊节点菜单
  else if (specialType) {
    let specialMenu = menu.filter(v => v.belong === specialType);
    menu.length = 0;
    menu.push(...specialMenu);
  }
  await nextTick();
  resizeMinHeight(Math.ceil(contextMenu()!.scrollHeight));
  props.item.active = true;
  updatePosition();
  document.getElementById("contextMenu")!.focus();
})


onUnmounted(() => {
  props.item.active = false;
})

type ContextMenuType = {
  name: string | Ref<string>,
  style?: StyleValue
  belong: "link" | "folder" | "both" | "none" | "blank" | "separator" | SpecialTreeNodeKey,
  click?: () => void | Promise<void>
}

let message = useMessage()!;
let dialog = useConfirmDialog();
let { t } = useI18n();
let store = useSettingStore();
let isTop = props.item.parentId === "0";
let cutNode = cutNodes[0];

console.log(props, "pro");

//剪切node的父节点在导航栏中的索引
let cutNodeParentNavigatorIdx = data.navigator.findIndex(v => v.id === cutNode?.parentId);
//粘贴到的节点的父节点在导航栏中的索引
let pasteNodeParentNavigatorIdx = data.navigator.findIndex(v => v.id === item.parentId);
//如果是文件夹
let isPasteParentToChild = !cutNode?.url && [
  //且自己复制进自己
  cutNode?.id === item.id,
  //或者自己的父节点复制进子节点
  cutNodeParentNavigatorIdx !== -1 && cutNodeParentNavigatorIdx < pasteNodeParentNavigatorIdx
].some(v => v);

const openUrl = (active: boolean) => {
  if (isInSelectNode(item)) {
    data.selectNodes.forEach(v => {
      if (!v.url) return;
      createTab(v.url!, active);
    })
  } else {
    createTab(props.item.url!, active);
  }
}

const createBookmark = async (title: string, url?: string) => {
  chrome.bookmarks.create({
    title: title,
    url: url,
    parentId: isBlank ? props.item.id : item.parentId,
    index: isBlank ? undefined : (item.index! + 1 || undefined)
  }).then(async value => {
    await updateAllBookmark();
    message(t("successfullyCreated"));
    clickLastNode();
  }, reason => {
    console.error(reason);
    message(t("failedToCreate"));
  })
}

const menu: ContextMenuType[] = reactive([
  {
    name: t("menuSetAsStart"),
    belong: every(!store.backLastPath, !selectStatus()) ? "folder" : "none",
    click: async () => {
      let startMenu = [...data.navigator];
      //fix 空白处右键菜单设置启动页会出现双层导航
      if (getLastNode().id !== props.item.id) {
        startMenu.push(props.item);
      }
      // fix 设置当前导航之前的目录为启动目录会多重显示
      let navigatorIndex = startMenu.findIndex(v => v.id === item.id);
      if (navigatorIndex !== -1) {
        startMenu.splice(navigatorIndex + 1)
      }
      await setAsStart(startMenu, await chrome.bookmarks.getChildren(props.item.id)).then(r => {
        if (r) {
          message?.(t("setDefaultStartMessage", {
            msg: props.item.title
          }))
        }
      })
    }
  },
  {
    name: t("menuAllOpen"),
    belong: !selectStatus() ? "folder" : "none",
    click: () => {
      chrome.bookmarks.getChildren(props.item.id).then(value => {
        value.forEach(v => {
          if (v.url) {
            createTab(v.url);
          }
        })
      })
    }
  },
  {
    belong: isBlank ? "blank" : isTop ? "none" : "both",
    name: t("menuNewFolder"),
    click() {
      let v = ref("");
      dialog.create({
        title: t("newFolderTitle"),
        content: h(InputDialogContent, {
          values: [{
            value: v,
            name: t("name")
          }]
        }),
        onOk() {
          createBookmark(v.value);
        }
      })
    },
  },
  {
    belong: isBlank ? "blank" : isTop ? "none" : "both",
    name: t("menuNewBookmark"),
    async click() {
      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      let v = ref(tab.title!);
      let link = ref(tab.url!);
      dialog.create({
        title: t("newBookmarkTitle"),
        content: h(InputDialogContent, {
          values: [{
            value: v,
            name: t("name")
          }, {
            value: link,
            name: t("link")
          }]
        }),
        onOk() {
          createBookmark(v.value, link.value);
        }
      })
    },
  },
  {
    belong: some(isTop, isBlank) ? "none" : "both",
    name: t("menuCreateSeparator"),
    async click() {
      createBookmark(SEPARATOR);
    },
  },
  {
    name: t("currentPageOpen"),
    belong: !selectStatus() ? specialType ?? "link" : "none",
    click: async () => {
      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.update(tab.id!, {
        active: true,
        url: props.item.url
      })
    }
  },
  {
    name: t("menuFrontDeskOpen"),
    belong: data.selectNodes.every(v => v.url) ? specialType ?? "link" : "none",
    click: () => {
      openUrl(true);
    }
  },
  {
    name: t("menuBackgroundOpen"),
    belong: data.selectNodes.every(v => v.url) ? specialType ?? "link" : "none",
    click: () => {
      openUrl(false);
    }
  },
  {
    name: t("menuCopyLink"),
    belong: selectStatus() ? "none" : specialType ?? "link",
    click: () => {
      navigator.clipboard.writeText(props.item.url!).then(() => {
        message(t("copySuccess"));
      })
    }
  },
  {
    name: t("menuCopyName"),
    belong: selectStatus() ? "none" : specialType ?? (isBlank ? "none" : "both"),
    click: () => {
      navigator.clipboard.writeText(props.item.title!).then(() => {
        message(t("copySuccess"));
      })
    }
  },
  {
    name: t("positioningBookmarks"),
    belong: selectStatus() ? "none" : ["frequently", "search"].includes(specialType!) ? props.isSeparator ? "separator" : specialType! : "none",
    click: () => {
      data.navigator.splice(1, data.navigator.length - 1,
        ...allBookmark[item.id]!.fullPath!.slice(1)
      );
      clickLastNode().then(() => {
        let targetEl = document.querySelector(`._bid_${item.id}`)! as HTMLElement;
        targetEl.classList.add("positionHighlight");
        targetEl.addEventListener("animationend", ev => {
          targetEl.classList.remove("positionHighlight");
        })
        if (store.displayMode === "h") {
          myScrollTo(targetEl.offsetLeft);
        } else {
          myScrollTo(0, targetEl.offsetTop);
        }
      })
    }
  },
  {
    name: t("menuMultiSelect"),
    belong: some(selectStatus(), isBlank) ? "none" : specialType ?? "both",
    click: () => {
      data.selectNodes = [item];
    }
  },
  {
    name: t("menuCancelMultiSelect"),
    belong: selectStatus() ? specialType ?? "both" : "none",
    click: () => {
      data.selectNodes.length = 0;
    }
  },
  {
    name: t("menuUpdate"),
    belong: selectStatus() ? "none" : specialType ?? "link",
    click() {
      dialog.create({
        content: () => t("menuUpdateMsg", {
          msg: item.title
        }),
        async onOk() {
          let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          await chrome.bookmarks.update(item.id, {
            title: tab?.title,
            url: tab?.url
          })
          clickLastNode();
          message(t("success"));
        },
        title: t("menuUpdate"),
      })
    }
  },
  {
    name: t("menuShear"),
    belong: some(isBlank, isTop) ? 'none' : "both",
    click() {
      cut(props.item);
    }
  },
  {
    name: t("menuPaste"),
    belong: some(
      //没有剪切内容
      !cutNode,
      //不能将父文件夹粘贴到子文件夹，会死循环
      isPasteParentToChild,
      //不能自己粘贴进自己
      !!cutNodes.find(v => v.id === item.id)
    ) ? 'none' : "both",
    style: {},
    click() {
      paste(props.item).then(() => {
        message(t("pasteSuccessfully"));
        if ([cutNodeParentNavigatorIdx, pasteNodeParentNavigatorIdx].every(v => v >= 0)) {
          data.navigator.splice(pasteNodeParentNavigatorIdx + 2, cutNodeParentNavigatorIdx - pasteNodeParentNavigatorIdx - 1)
        }
        updateAllBookmark()
        clickLastNode();
      }, reason => {
        message(t("pasteFailed"));
      })
    }
  },
  {
    name: t("menuEditor"),
    belong: selectStatus() ? "none" : specialType ?? some(isBlank, isTop) ? 'none' : "both",
    click() {
      let title = ref(props.item.title);
      let url = ref(props.item.url!);
      let values: InputContentValueType[] = [{
        name: t("name"),
        value: title,
      }];
      if (url.value) {
        values.push({
          name: t("link"),
          value: url,
        })
      }
      dialog.create({
        title: t("editBookmark"),
        content: h(InputDialogContent, { values }),
        onOk() {
          chrome.bookmarks.update(props.item.id, {
            title: title.value,
            url: url.value,
          }).then(() => {
            message(t("modificationSucceeded"));
            if (getLastNode().id !== specialTreeNode.search.id) {
              clickLastNode();
            }
            /*导航栏修改后实时刷新*/
            item.title = title.value;
            item.url = url.value;
            /*更新信息*/
            updateAllBookmark();
          }, reason => {
            message(t("modificationFailed"));
          })
        }
      })
    }
  },
  {
    name: t("menuDelete"),
    belong: some(isBlank, isTop) ? 'none' : props.isSeparator ? "separator" : "both",
    style: {
      color: "#cc0000"
    },
    click() {
      let msg = t("deletePrompt", {
        msg: props.isSeparator ? t("separator") : item.title
      })
      if (isInSelectNode(item)) {
        let first = data.selectNodes[0];
        if (data.selectNodes.length > 1) {
          msg = t("deleteMultiplePrompt", {
            msg: first.title,
            num: data.selectNodes.length
          })
        }
      }
      dialog.create({
        type: "warning",
        async onOk() {
          try {
            if (isInSelectNode(item)) {
              for (let selectNode of data.selectNodes) {
                await chrome.bookmarks.removeTree(selectNode.id)
              }
            } else {
              await chrome.bookmarks.removeTree(props.item.id)
            }
            clickLastNode();
            message(t("deletedSuccessfully"));
          } catch (e) {
            message(t("deleteFailed"));
            console.error(e);
          }
          data.selectNodes.length = 0;
        },
        title: t("deleteBookmark"),
        content: () => msg,
      })
    }
  },
  {
    name: t("menuDelete"),
    belong: "frequently",
    click: () => {
      if (isInSelectNode(item)) {
        data.selectNodes.forEach(v => updateFrequentlyUsedBookmarks(v, "del"));
      } else {
        updateFrequentlyUsedBookmarks(props.item, "del");
      }
      message(t("deletedSuccessfully"));
      clickLastNode();
      data.selectNodes.length = 0;
    }
  },
])

const contextMenu = () => document.getElementById("contextMenu");

const close = () => {
  contextMenu()!.blur();
}

let emits = defineEmits();
const removeContextMenu = () => {
  emits("remove");
}

</script>

<template>
  <div id="contextMenu"
    class="fixed max-h-screen break-keep whitespace-nowrap overflow-hidden z-50 text-color border min-w-[100px] p-1 !bg-color"
    tabindex="-1" @blur="removeContextMenu">
    <div :style="m.style" v-for="m in menu" @click="m.click?.(), close()"
      v-show="m.belong === 'both' || item.url && m.belong === 'link' || !item.url && m.belong === 'folder' || isBlank && m.belong === 'blank' || m.belong === specialType || isSeparator && m.belong === 'separator'"
      class="py-1 hover-color px-2">{{ m.name }}
    </div>
  </div>
</template>

<style>
.positionHighlight {
  animation: positionHighlightAnimation reverse 3s;
}

@keyframes positionHighlightAnimation {
  from {
    background: transparent;
  }

  to {
    background: #05cd86;
  }
}
</style>