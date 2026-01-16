import { inject, h } from "vue";
import { PROVIDE_CONTEXT_MENU, SEPARATOR } from "@/util/constants";
import type { ContextMenuInject, TreeNode } from "../../../../../types";
import ContextMenu from "@/view/BookmarkList/components/contextMenu/ContextMenu.vue";
import { type SpecialTreeNodeKey, useAppData } from "@/util/useAppData";
import { useSettingStore } from "@/store/settingStore";

export const useContextMenu = () => {
  let contextMenuInject = inject<ContextMenuInject>(PROVIDE_CONTEXT_MENU)!;
  let { isSpecialTreeNode, getLastNode } = useAppData();
  let store = useSettingStore();
  const createContextMenu = (e: MouseEvent, item: TreeNode, isBlank?: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (!store.rightClickMenu) {
      return;
    }
    //根节点与特殊节点不允许操作
    if (item.id === "0" || isSpecialTreeNode(item.id) || isSpecialTreeNode(getLastNode().id)) {
      return;
    }
    contextMenuInject.show.value = true;
    contextMenuInject.comp.value = h(ContextMenu, {
      x: e.clientX,
      y: e.clientY,
      item,
      isBlank,
      isSeparator: !item.url && item.title === SEPARATOR
    })
  }

  const createSpecialContextMenu = (e: MouseEvent, item: TreeNode, specialType: SpecialTreeNodeKey) => {
    e.preventDefault();
    e.stopPropagation();
    if (!store.rightClickMenu) {
      return;
    }
    contextMenuInject.show.value = true;
    contextMenuInject.comp.value = h(ContextMenu, {
      x: e.clientX,
      y: e.clientY,
      item,
      specialType,
      isSeparator: !item.url && item.title === SEPARATOR
    })
  }

  return {
    createSpecialContextMenu,
    createContextMenu
  }
}

