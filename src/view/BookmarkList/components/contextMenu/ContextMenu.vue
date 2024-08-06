<script setup lang="ts">
import {h, nextTick, onMounted, onUnmounted, reactive, ref, type Ref, type StyleValue} from "vue";
import type {TreeNode} from "../../../../../types";
import {createTab, myScrollTo, resizeMinHeight, resizeWidthContainer, some} from "@/util/appUtil";
import {useMessage} from "@/util/useMessage";
import {useConfirmDialog} from "@/view/BookmarkList/components/dialog/useDialog";
import {allBookmark, setAsStart, type SpecialTreeNodeKey, updateAllBookmark, useAppData} from "@/util/useAppData";
import {useI18n} from "vue-i18n";
import MyInput from "@/view/BookmarkList/components/dialog/MyInput.vue";
import {updateFrequentlyUsedBookmarks} from "@/util/storage";
import {useSettingStore} from "@/store/settingStore";

const props = defineProps<{
  x: number,
  y: number,
  item: TreeNode,
  isBlank?: boolean,
  specialType?: SpecialTreeNodeKey
}>()

let {item, isBlank, specialType} = props;

let {clickLastNode, cut, cutNode, paste, data, getLastNode, specialTreeNode} = useAppData();
const updatePosition = () => {
  let contextMenu = document.getElementById("contextMenu")!;
  let {clientWidth, clientHeight} = document.body;
  let {offsetWidth, offsetHeight} = contextMenu;
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
  //特殊节点菜单
  if (specialType) {
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
  belong: "link" | "folder" | "both" | "none" | "blank" | SpecialTreeNodeKey,
  click?: () => void | Promise<void>
}

let message = useMessage()!;
let dialog = useConfirmDialog();
let {t} = useI18n();

let store = useSettingStore();

let isTop = props.item.parentId === "0";
//剪切node的父节点在导航栏中的索引
let cutNodeParentNavigatorIdx = data.navigator.findIndex(v => v.id === cutNode.value?.parentId);
//粘贴到的节点的父节点在导航栏中的索引
let pasteNodeParentNavigatorIdx = data.navigator.findIndex(v => v.id === item.parentId);
//如果是文件夹
let isPasteParentToChild = !cutNode?.value?.url && [
  //且自己复制进自己
  cutNode?.value?.id === item.id,
  //或者自己的父节点复制进子节点
  cutNodeParentNavigatorIdx !== -1 && cutNodeParentNavigatorIdx < pasteNodeParentNavigatorIdx
].some(v => v);
const menu: ContextMenuType[] = reactive([
  {
    name: t("menuSetAsStart"),
    belong: !store.backLastPath ? "folder" : "none",
    click: async () => {
      let startMenu = [...data.navigator];
      //fix 空白处右键菜单设置启动页会出现双层导航
      if (getLastNode().id !== props.item.id) {
        startMenu.push(props.item);
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
    belong: "folder",
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
    belong: "blank",
    name: t("menuNewFolder"),
    click() {
      let v = ref("");
      dialog.create({
        title: t("newFolderTitle"),
        content: () => h("div", {
          class: "text-left"
        }, [
          h(MyInput, {
            v,
            prefix: t("name")
          })
        ]),
        onOk() {
          chrome.bookmarks.create({
            title: v.value,
            parentId: props.item.id
          }).then(value => {
            message(t("successfullyCreated"));
            clickLastNode();
          }, reason => {
            message(t("failedToCreate"));
          })
        }
      })
    },
  },
  {
    belong: "blank",
    name: t("menuNewBookmark"),
    async click() {
      let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      let v = ref(tab.title!);
      let link = ref(tab.url!);
      dialog.create({
        title: t("newBookmarkTitle"),
        content: () => h("div", {
          class: "text-left"
        }, [
          h(MyInput, {
            class: "mb-2",
            v,
            prefix: t("name")
          }),
          h(MyInput, {
            v: link,
            prefix: t("link")
          }),
        ]),
        onOk() {
          chrome.bookmarks.create({
            title: v.value,
            url: link.value,
            parentId: props.item.id
          }).then(v => {
            message(t("successfullyCreated"));
            updateAllBookmark();
            clickLastNode();
          }, reason => {
            message(t("failedToCreate"));
          })
        }
      })
    },
  },
  {
    name: t("currentPageOpen"),
    belong: specialType ?? "link",
    click: async () => {
      let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      await chrome.tabs.update(tab.id!, {
        active: true,
        url: props.item.url
      })
    }
  },
  {
    name: t("menuFrontDeskOpen"),
    belong: specialType ?? "link",
    click: () => {
      createTab(props.item.url!, true);
    }
  },
  {
    name: t("menuBackgroundOpen"),
    belong: specialType ?? "link",
    click: () => {
      createTab(props.item.url!, false);
    }
  },
  {
    name: t("menuCopyLink"),
    belong: specialType ?? "link",
    click: () => {
      navigator.clipboard.writeText(props.item.url!).then(() => {
        message(t("copySuccess"));
      })
    }
  },
  {
    name: t("menuCopyName"),
    belong: specialType ?? (isBlank ? "none" : "both"),
    click: () => {
      navigator.clipboard.writeText(props.item.title!).then(() => {
        message(t("copySuccess"));
      })
    }
  },
  {
    name: t("positioningBookmarks"),
    belong: ["frequently", "search"].includes(specialType!) ? specialType! : "none",
    click: () => {
      data.navigator.splice(1, data.navigator.length - 1,
          ...allBookmark[item.id]!.fullPath!.slice(1)
      );
      clickLastNode()
      setTimeout(() => {
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
      }, 250)
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
        cutNode.value === null,
        //不能将父文件夹粘贴到子文件夹，会死循环
        isPasteParentToChild
    ) ? 'none' : "both",
    style: {},
    click() {
      paste(props.item).then(() => {
        message(t("pasteSuccessfully"));
        if ([cutNodeParentNavigatorIdx, pasteNodeParentNavigatorIdx].every(v => v >= 0)) {
          data.navigator.splice(pasteNodeParentNavigatorIdx + 2, cutNodeParentNavigatorIdx - pasteNodeParentNavigatorIdx - 1)
        }
        clickLastNode();
      }, reason => {
        message(t("pasteFailed"));
      })
    }
  },
  {
    name: t("menuEditor"),
    belong: specialType ? specialType : some(isBlank, isTop) ? 'none' : "both",
    click() {
      let title = ref(props.item.title);
      let url = ref(props.item.url!);
      dialog.create({
        title: t("editBookmark"),
        content: () => {
          return h("div", {
            class: "text-left"
          }, [
            h(MyInput, {
              class: "mb-2",
              v: title,
              prefix: t("name"),
            }),
            url.value && h(MyInput, {
              v: url,
              prefix: t("link"),
            }),
          ])
        },
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
    belong: some(isBlank, isTop) ? 'none' : "both",
    style: {
      color: "#cc0000"
    },
    click() {
      dialog.create({
        type: "warning",
        onOk() {
          chrome.bookmarks.removeTree(props.item.id).then(() => {
            message(t("deletedSuccessfully"));
            let idx = data.navigator.findIndex(v => v.id === props.item.id);
            if (idx !== -1) {
              data.navigator.splice(idx);
            }
            clickLastNode();
          }, reason => {
            message(t("deleteFailed"));
          })
        },
        title: t("deleteBookmark"),
        content: () => t("deletePrompt", {
          msg: item.title
        }),
      })
    }
  },
  {
    name: t("menuDelete"),
    belong: "frequently",
    click: () => {
      updateFrequentlyUsedBookmarks(props.item, "del");
      message(t("deletedSuccessfully"));
      clickLastNode();
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
       tabindex="-1"
       @blur="removeContextMenu">
    <div :style="m.style" v-for="m in menu"
         @click="m.click?.(), close()"
         v-show="m.belong === 'both' || item.url && m.belong === 'link' || !item.url && m.belong === 'folder' || isBlank && m.belong === 'blank' || m.belong === specialType"
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