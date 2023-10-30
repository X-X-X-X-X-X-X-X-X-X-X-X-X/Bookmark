<script setup lang="ts">
import {h, nextTick, onMounted, onUnmounted, reactive, ref, type Ref, type StyleValue} from "vue";
import type {TreeNode} from "../../../../../types";
import {createTab, some} from "@/util/appUtil";
import {useMessage} from "@/util/useMessage";
import {useConfirmDialog} from "@/view/BookmarkList/components/dialog/useDialog";
import {setAsStart, useAppData} from "@/util/useAppData";
import {useI18n} from "vue-i18n";
import MyInput from "@/view/BookmarkList/components/dialog/MyInput.vue";
import type {SpecialMenuType} from "@/view/BookmarkList/components/contextMenu/useContextMenu";
import {updateFrequentlyUsedBookmarks} from "@/util/storage";

const props = defineProps<{
  x: number,
  y: number,
  item: TreeNode,
  isBlank?: boolean,
  specialType?: SpecialMenuType
}>()

let {item, isBlank, specialType} = props;

let {clickLastNode, cut, cutNode, paste, data} = useAppData();
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
  belong: "link" | "folder" | "both" | "none" | "blank" | SpecialMenuType,
  click?: () => void | Promise<void>
}

let message = useMessage()!;
let dialog = useConfirmDialog();
let {t} = useI18n();

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
    belong: "folder",
    click: async () => {
      await setAsStart([...data.navigator, props.item], await chrome.bookmarks.getChildren(props.item.id));
      message?.(t("setDefaultStartMessage", {
        msg: props.item.title
      }))
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
    belong: "link",
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
    belong: "link",
    click: () => {
      createTab(props.item.url!, true);
    }
  },
  {
    name: t("menuBackgroundOpen"),
    belong: "link",
    click: () => {
      createTab(props.item.url!, false);
    }
  },
  {
    name: t("menuCopyLink"),
    belong: "link",
    click: () => {
      navigator.clipboard.writeText(props.item.url!).then(() => {
        message(t("copySuccess"));
      })
    }
  },
  {
    name: t("menuCopyName"),
    belong: isBlank ? "none" : "both",
    click: () => {
      navigator.clipboard.writeText(props.item.title!).then(() => {
        message(t("copySuccess"));
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
    belong: some(isBlank, isTop) ? 'none' : "both",
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
            clickLastNode();
            /*导航栏修改后实时刷新*/
            item.title = title.value;
            item.url = url.value;
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
    belong: "frequent",
    click: () => {
      updateFrequentlyUsedBookmarks(props.item, "del");
      message(t("deletedSuccessfully"));
      clickLastNode();
    }
  }
])

const close = () => {
  document.getElementById("contextMenu")!.blur();
}

let emits = defineEmits();
const removeContextMenu = () => {
  emits("remove");
}

</script>

<template>
  <div id="contextMenu" class="fixed max-h-screen overflow-y-auto z-50 text-color border min-w-[100px] p-1 !bg-color"
       tabindex="-1"
       @blur="removeContextMenu">
    <div :style="m.style" v-for="m in menu"
         @click="m.click?.(), close()"
         v-show="m.belong === 'both' || item.url && m.belong === 'link' || !item.url && m.belong === 'folder' || isBlank && m.belong === 'blank' || m.belong === specialType"
         class="py-1 hover-color px-2">{{ m.name }}
    </div>
  </div>
</template>

<style scoped>
</style>