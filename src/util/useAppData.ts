import {computed, inject, nextTick, reactive, ref} from "vue";
import {FREQUENTLY_USED_BOOKMARKS_KEY, PROVIDE_APP_DATA_KEY} from "@/util/constants";
import type {AppData, TreeNode} from "../../types";
import {useSettingStore} from "@/store/settingStore";
import {storageGet, updateFrequentlyUsedBookmarks} from "@/util/storage";
import {createTab, resizeWidthContainer} from "@/util/appUtil";
import {useI18n} from "vue-i18n";

const cutNode = ref<TreeNode | null>(null);

/*
* 这破i18n首次加载不进来会报错，giao!!!!!!!!!!!!!!!!!!!!!!!!!!!!
* */
export const useAppData = (defaultData?: AppData, initI18n?: ReturnType<typeof useI18n>) => {
    let data = defaultData || inject<AppData>(PROVIDE_APP_DATA_KEY, {
        bookmarkTree: [],
        navigator: []
    });
    let settingStore = useSettingStore();
    let {t} = initI18n || useI18n();
    /*特殊节点*/
    const specialTreeNode = reactive({
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
                    replaceTree(storageGet<TreeNode[]>(FREQUENTLY_USED_BOOKMARKS_KEY) || [], "frequently");
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
    const getLastNode = () => data.navigator[data.navigator.length - 1];
    return {
        data,
        getLastNode,
        clickBookmark,
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