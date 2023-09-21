import type {TreeNode} from "../../types";
import {useSettingStore} from "@/store/settingStore";
import {useAppData} from "@/util/useAppData";

export const useTreeNodeHover = () => {
    let hoverTimer: number;
    let settingStore = useSettingStore();
    let {clickBookmark, navigatorTo} = useAppData();
    const hoverEnterEvent = (item: TreeNode, isNavigator?: boolean) => {
        if (!item.url && settingStore.hoverEnterFolderMs > 0) {
            hoverTimer = setTimeout(async () => {
                if (!isNavigator) {
                    await clickBookmark(item);
                } else {
                    await navigatorTo(item);
                }
            }, settingStore.hoverEnterFolderMs);
        }
    }
    const hoverLeaveEvent = () => {
        clearTimeout(hoverTimer);
    }

    return {
        hoverEnterEvent,
        hoverLeaveEvent
    }
}