import {computed, inject, nextTick, reactive, ref} from "vue";
import {
    DEFAULT_START_DATA_KEY,
    DEFAULT_START_KEY,
    FREQUENTLY_USED_BOOKMARKS_KEY,
    PROVIDE_APP_DATA_KEY
} from "@/util/constants";
import type {AppData, TreeNode} from "../../types";
import {useSettingStore} from "@/store/settingStore";
import {storageGet, storageSet, updateFrequentlyUsedBookmarks} from "@/util/storage";
import {createTab, resizeWidthContainer} from "@/util/appUtil";
import {useI18n} from "vue-i18n";

const cutNode = ref<TreeNode | null>(null);
export let allBookmark: {
    [k: string]: TreeNode
} = {};

export const setAllBookmark = (bookmarks: TreeNode[]) => {
    const getBookmark = (findBookmarks: TreeNode[]) => {
        findBookmarks.forEach(b => {
            if (b.children) {
                getBookmark(b.children)
            } else {
                allBookmark[b.id] = b;
            }
        })
    }
    allBookmark = {};
    getBookmark(bookmarks);
}

export const updateAllBookmark = async () => {
    setAllBookmark(await chrome.bookmarks.getTree());
}

export type SpecialTreeNodeKey = "search" | "frequently";

export type SpecialTreeNode = {
    [k in SpecialTreeNodeKey]: TreeNode
}

export const useAppData = (defaultData?: AppData, initI18n?: ReturnType<typeof useI18n>) => {
    let data = defaultData || inject<AppData>(PROVIDE_APP_DATA_KEY, {
        bookmarkTree: [],
        navigator: []
    });
    let settingStore = useSettingStore();
    let {t} = initI18n || useI18n();
    /*特殊节点*/
    const specialTreeNode: SpecialTreeNode = reactive({
        search: {
            id: "-1",
            title: computed(() => t("searchResult")),
        },
        frequently: {
            id: "-2",
            title: computed(() => t("frequentlyBookmark")),
        }
    })

    const isSpecialTreeNode = (id: string) => {
        return Object.values(specialTreeNode).some(v => v.id === id);
    }

    const getSpecialTreeNodeKey = (id: string) => {
        return Object.keys(specialTreeNode).find((v) => specialTreeNode[v as SpecialTreeNodeKey].id === id) as SpecialTreeNodeKey;
    }

    const replaceTree = (treeNodes: TreeNode[], type?: string) => {
        treeNodes.forEach(v => v.type = type ?? "");
        data.bookmarkTree.splice(0, data.bookmarkTree.length, ...treeNodes);
        resizeWidthContainer();
    }
    const clickBookmark = async (node: TreeNode, active?: boolean) => {
        if (node.url) {
            //如果启用常用书签，进行记录
            if (settingStore.enableFrequentlyUsedBookmarks) {
                updateFrequentlyUsedBookmarks(node);
            }
            await createTab(node.url, active);
        } else {
            //不是根目录和搜索结果，PUSH进导航
            if (node.id !== data.navigator[0].id && data.navigator[data.navigator.length - 1].id !== specialTreeNode.search.id) {
                data.navigator.push(node);
            }
            //常用书签
            if (node.id === specialTreeNode.frequently.id) {
                if (settingStore.enableFrequentlyUsedBookmarks) {
                    /*每次刷新已变更、已删除的书签*/
                    await updateAllBookmark();
                    let frequentlyUsedBookmarks = storageGet<TreeNode[]>(FREQUENTLY_USED_BOOKMARKS_KEY) || [];
                    let refreshFrequentlyUsedBookmarks: TreeNode[] = [];
                    frequentlyUsedBookmarks.forEach(v => {
                        if (allBookmark[v.id]) {
                            refreshFrequentlyUsedBookmarks.push(Object.assign(v, allBookmark[v.id] ?? {}));
                        }
                    })
                    storageSet(FREQUENTLY_USED_BOOKMARKS_KEY, refreshFrequentlyUsedBookmarks);
                    replaceTree(refreshFrequentlyUsedBookmarks, "frequently");
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
        try {
            if (data.navigator.length === 1) {
                await clickBookmark(data.navigator[0]);
            } else {
                await clickBookmark(data.navigator.pop() as TreeNode);
            }
        } catch (e) {
            //一般来讲为启动目录已被删除会触发
            data.navigator.splice(1);
            clickLastNode();
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

    const cut = (node: TreeNode) => {
        if (node.id === cutNode.value?.id) {
            cutNode.value = null;
        } else {
            cutNode.value = node;
        }
    }
    const paste = async (node: TreeNode) => {
        //链接
        if (node.url) {
            let idx = data.bookmarkTree.findIndex(value => value.id === node.id);
            await chrome.bookmarks.move(cutNode.value!.id, {
                parentId: node.parentId,
                index: idx
            });
        }
        //文件夹
        else {
            await chrome.bookmarks.move(cutNode.value!.id, {
                parentId: node.id
            })
        }
        cutNode.value = null;
    }
    const updateNode = (node: TreeNode) => {
        for (let [k, v] of Object.entries(specialTreeNode)) {
            if (v.id === node.id) {
                return specialTreeNode[k as keyof typeof specialTreeNode];
            }
        }
        Object.assign(node, allBookmark[node.id] ?? {});
        return node;
    }

    const getLastNode = () => data.navigator[data.navigator.length - 1];
    return {
        updateNode,
        data,
        getLastNode,
        clickBookmark,
        getSpecialTreeNodeKey,
        specialTreeNode,
        isSpecialTreeNode,
        back,
        navigatorTo,
        replaceTree,
        clickLastNode,
        cutNode,
        cut,
        paste
    }
}


export const setAsStart = async (node: TreeNode | TreeNode[], data: TreeNode[] = []) => {
    let lastNode: TreeNode;
    if (Array.isArray(node)) {
        lastNode = node[node.length - 1];
    } else {
        lastNode = node;
    }
    //不是搜索结果
    if (lastNode.id !== "-1") {
        storageSet(DEFAULT_START_KEY, node);
        storageSet(DEFAULT_START_DATA_KEY, data);
        return true;
    }
}