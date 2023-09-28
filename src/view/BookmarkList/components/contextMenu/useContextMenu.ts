import {inject, h} from "vue";
import {PROVIDE_CONTEXT_MENU} from "@/util/constants";
import type {ContextMenuInject, TreeNode} from "../../../../../types";
import ContextMenu from "@/view/BookmarkList/components/contextMenu/ContextMenu.vue";

export const useContextMenu = () => {
    let contextMenuInject = inject<ContextMenuInject>(PROVIDE_CONTEXT_MENU)!;
    const createContextMenu = (e: MouseEvent, item: TreeNode) => {
        e.preventDefault();
        contextMenuInject.show.value = true;
        contextMenuInject.comp.value = h(ContextMenu, {
            x: e.clientX,
            y: e.clientY,
            item
        })
    }
    return {
        createContextMenu
    }
}