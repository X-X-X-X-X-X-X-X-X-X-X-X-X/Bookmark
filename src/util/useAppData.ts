import {inject} from "vue";
import {FREQUENTLY_USED_BOOKMARKS_KEY, PROVIDE_APP_DATA_KEY} from "@/util/constants";
import type {AppData, TreeNode} from "../../types";
import {useSettingStore} from "@/store/settingStore";
import {storageGet, updateFrequentlyUsedBookmarks} from "@/util/storage";

export const useAppData = (defaultData?: AppData) => {
    let data = inject<AppData>(PROVIDE_APP_DATA_KEY, defaultData || {
        bookmarkTree: [],
        navigator: []
    });
    let settingStore = useSettingStore();

    const replaceTree = (treeNodes: TreeNode[]) => {
        data.bookmarkTree.splice(0, data.bookmarkTree.length, ...treeNodes);
    }
    const clickBookmark = async (node: TreeNode) => {
        if (node.url) {
            //如果启用常用书签，进行记录
            if (settingStore.enableFrequentlyUsedBookmarks) {
                updateFrequentlyUsedBookmarks(node);
            }
            await chrome.tabs.create({
                active: settingStore.openUrlMode === "front",
                url: node.url,
            })
        } else {
            //常用书签
            if (node.id === "-2") {
                replaceTree(storageGet<TreeNode[]>(FREQUENTLY_USED_BOOKMARKS_KEY) || []);
            } else {
                replaceTree(await chrome.bookmarks.getChildren(node.id))
            }
            //不是根目录和搜索结果，PUSH进导航
            if (node.id !== data.navigator[0].id && data.navigator[data.navigator.length - 1].id !== "-1") {
                data.navigator.push(node);
            }
        }
    }
    const clickLastNode = async () => {
        if (data.navigator.length === 1) {
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

    return {
        data,
        clickBookmark,
        back,
        replaceTree,
        clickLastNode
    }
}