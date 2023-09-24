import {inject, nextTick} from "vue";
import {FREQUENTLY_USED_BOOKMARKS_KEY, PROVIDE_APP_DATA_KEY} from "@/util/constants";
import type {AppData, TreeNode} from "../../types";
import {useSettingStore} from "@/store/settingStore";
import {storageGet, updateFrequentlyUsedBookmarks} from "@/util/storage";
import {createTab, resizeWidthContainer} from "@/util/appUtil";

export const useAppData = (defaultData?: AppData) => {
    let data = defaultData || inject<AppData>(PROVIDE_APP_DATA_KEY, {
        bookmarkTree: [],
        navigator: []
    });
    let settingStore = useSettingStore();
    const replaceTree = (treeNodes: TreeNode[]) => {
        data.bookmarkTree.splice(0, data.bookmarkTree.length, ...treeNodes);
        resizeWidthContainer();
    }
    const clickBookmark = async (node: TreeNode) => {
        if (node.url) {
            //如果启用常用书签，进行记录
            if (settingStore.enableFrequentlyUsedBookmarks) {
                updateFrequentlyUsedBookmarks(node);
            }
            await createTab(node.url);
        } else {
            //不是根目录和搜索结果，PUSH进导航
            if (node.id !== data.navigator[0].id && data.navigator[data.navigator.length - 1].id !== "-1") {
                data.navigator.push(node);
            }
            //常用书签
            if (node.id === "-2") {
                if (settingStore.enableFrequentlyUsedBookmarks) {
                    replaceTree(storageGet<TreeNode[]>(FREQUENTLY_USED_BOOKMARKS_KEY) || []);
                } else {
                    await clickLastNode();
                    return;
                }
            } else {
                replaceTree(await chrome.bookmarks.getChildren(node.id))
            }
        }
    }
    const clickLastNode = async () => {
        //。。。。忘记是哪里的东西会触发了
        if (data.navigator.length === 0) {
            return;
        } else if (data.navigator.length === 1) {
            await clickBookmark(data.navigator[0]);
        } else {
            await clickBookmark(data.navigator.pop() as TreeNode);
        }
    }
    const back = async () => {
        if (data.navigator.length > 1) {
            data.navigator.pop();
        }
        await clickLastNode();
    }
    const navigatorTo = async (item: TreeNode) => {
        let idx = data.navigator.findIndex(value => value.id === item.id);
        if (idx !== -1) {
            data.navigator.splice(idx + 1);
            await clickLastNode();
        }
    }

    return {
        data,
        clickBookmark,
        back,
        navigatorTo,
        replaceTree,
        clickLastNode
    }
}