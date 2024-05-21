import {inject, h} from "vue";
import {PROVIDE_CONTEXT_MENU} from "@/util/constants";
import type {ContextMenuInject, TreeNode} from "../../../../../types";
import ContextMenu from "@/view/BookmarkList/components/contextMenu/ContextMenu.vue";
import {type SpecialTreeNodeKey, useAppData} from "@/util/useAppData";
import {useSettingStore} from "@/store/settingStore";

export const useContextMenu = () => {
    let contextMenuInject = inject<ContextMenuInject>(PROVIDE_CONTEXT_MENU)!;
    let {isSpecialTreeNode, getLastNode} = useAppData();
    let store = useSettingStore();
    const createContextMenu = (e: MouseEvent, item: TreeNode, isBlank?: boolean) => {
        if (!store.rightClickMenu) {
            return;
        }
        //根节点与特殊节点不允许操作
        if (item.id === "0" || isSpecialTreeNode(item.id) || isSpecialTreeNode(getLastNode().id)) {
            return;
        }
        // 如果是根节点下的文件夹只需要收藏夹
        if (item.parentId === "0" && !["1", "2"].some(v => item.id)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        contextMenuInject.show.value = true;
        contextMenuInject.comp.value = h(ContextMenu, {
            x: e.clientX,
            y: e.clientY,
            item,
            isBlank
        })
    }

    const createSpecialContextMenu = (e: MouseEvent, item: TreeNode, specialType: SpecialTreeNodeKey) => {
        if (!store.rightClickMenu) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        contextMenuInject.show.value = true;
        contextMenuInject.comp.value = h(ContextMenu, {
            x: e.clientX,
            y: e.clientY,
            item,
            specialType
        })
    }

    return {
        createSpecialContextMenu,
        createContextMenu
    }
}

