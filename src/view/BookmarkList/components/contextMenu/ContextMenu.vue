<script setup lang="ts">
import {computed, h, onMounted, onUnmounted, reactive, type Ref, type StyleValue} from "vue";
import type {TreeNode} from "../../../../../types";
import {createTab} from "@/util/appUtil";
import {useMessage} from "@/util/useMessage";
import {useConfirmDialog} from "@/view/BookmarkList/components/dialog/useDialog";
import {useAppData} from "@/util/useAppData";
import {NInput} from "naive-ui";
import {useI18n} from "vue-i18n";

const props = withDefaults(defineProps<{
  x: number,
  y: number,
  item: TreeNode
}>(), {
  x: 0,
  y: 0,
  item: null as any
})

let item = props.item as TreeNode;

let {clickLastNode, cut, cutNode, paste, data, isSpecialTreeNode} = useAppData();
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

onMounted(() => {
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
  belong: "link" | "folder" | "both" | "none"
  click?: () => void
}

let message = useMessage()!;
let dialog = useConfirmDialog();
let {t} = useI18n();

let isTop = !props.item.parentId || props.item.parentId === "0";
let isSpecial = isSpecialTreeNode(props.item);
//剪切node的父节点在导航栏中的索引
let cutNodeParentNavigatorIdx = data.navigator.findIndex(v => v.id === cutNode.value?.parentId);
//粘贴到的节点的父节点在导航栏中的索引
let pasteNodeParentNavigatorIdx = data.navigator.findIndex(v => v.id === item.parentId);
//如果是文件夹
let isPasteParentToChild = !cutNode?.value?.url && [
  //且自己复制进自己
  cutNode?.value?.id === item.id,
  //或者自己的父节点复制进子节点
  cutNodeParentNavigatorIdx < pasteNodeParentNavigatorIdx
].some(v => v);

const menu: ContextMenuType[] = reactive([
  {
    name: t("menuAllOpen"),
    belong: isSpecial ? "none" : "folder",
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
    belong: "both",
    click: () => {
      navigator.clipboard.writeText(props.item.title!).then(() => {
        message(t("copySuccess"));
      })
    }
  },
  {
    name: t("menuShear"),
    belong: isTop ? 'none' : "both",
    click() {
      cut(props.item);
    }
  },
  {
    name: t("menuPaste"),
    belong: [
      //不能粘贴到根目录
      item.id === "0",
      //不能粘贴到特殊目录
      isSpecial,
      //没有剪切内容
      cutNode.value === null,
      //不能将父文件夹粘贴到子文件夹，会死循环
      isPasteParentToChild
    ].some(v => v) ? 'none' : "both",
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
    belong: isTop ? 'none' : "both",
    click() {
      let title = props.item.title;
      let url = props.item.url;
      dialog.create({
        title: t("editBookmark"),
        content: () => {
          return h("div", {
            class: "text-left"
          }, [
            h(NInput, {
              class: "mb-2",
              size: "small",
              defaultValue: title,
              onUpdateValue: (v: string) => {
                title = v;
              }
            }, {
              prefix: () => h("span", {
                class: "font-bold"
              }, t("name"))
            }),
            props.item.url && h(NInput, {
              size: "small",
              defaultValue: url,
              onUpdateValue: (v: string) => {
                url = v;
              },
            }, {
              prefix: () => h("span", {
                class: "font-bold"
              }, t("link"))
            }),
          ])
        },
        onOk() {
          chrome.bookmarks.update(props.item.id, {
            title,
            url,
          }).then(() => {
            message(t("modificationSucceeded"));
            clickLastNode();
            /*导航栏修改后实时刷新*/
            item.title = title;
            item.url = url;
          }, reason => {
            message(t("modificationFailed"));
          })
        }
      })
    }
  },
  {
    name: t("menuDelete"),
    belong: isTop ? 'none' : "both",
    style: {
      color: "#cc0000"
    },
    click() {
      dialog.create({
        type: "warning",
        onOk() {
          chrome.bookmarks.removeTree(props.item.id).then(() => {
            message(t("deleteSuccessfully"));
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
  <div id="contextMenu" class="text-color border min-w-[100px] p-1 !bg-color"
       tabindex="-1"
       @blur="removeContextMenu">
    <div :style="m.style" v-for="m in menu"
         @click="m.click?.(), close()"
         v-show="m.belong === 'both' || item.url && m.belong === 'link' || !item.url && m.belong === 'folder'"
         class="py-1 hover-color px-2">{{ m.name }}
    </div>
  </div>
</template>

<style scoped>
#contextMenu {
  position: fixed;
  z-index: 49;
}
</style>