import {computed, inject, reactive, ref} from "vue";
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
import {i18n} from "@/i18n/i18n";

const cutNodes = reactive<TreeNode[]>([]);
export let allBookmark: {
  [k: string]: TreeNode
} = {};

export const rootDirs = ["1", "2", "3"];

export const getTree = async () => {
  return await chrome.bookmarks.getTree();
}

export const setAllBookmark = (bookmarks: TreeNode[]) => {
  const getBookmark = (findBookmarks: TreeNode[], parentPath: TreeNode[] = []) => {
    findBookmarks.forEach(b => {
      allBookmark[b.id] = b;
      allBookmark[b.id].fullPath = parentPath;
      if (b.children) {
        getBookmark(b.children, [...parentPath, {title: b.title, id: b.id}])
      }
    })
  }
  allBookmark = {};
  getBookmark(bookmarks);
}

export const updateAllBookmark = async () => {
  setAllBookmark(await getTree());
}

export type SpecialTreeNodeKey = "search" | "frequently";

export type SpecialTreeNode = {
  [k in SpecialTreeNodeKey]: TreeNode
}

export const useAppData = () => {
  let data = inject<AppData>(PROVIDE_APP_DATA_KEY)!;
  let settingStore = useSettingStore();
  /*特殊节点*/
  const specialTreeNode: SpecialTreeNode = reactive({
    search: {
      id: "-1",
      title: computed(() => i18n.global.t("searchResult")),
    },
    frequently: {
      id: "-2",
      title: computed(() => i18n.global.t("frequentlyBookmark")),
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
      if (node.id !== data.navigator[0].id && getLastNode().id !== specialTreeNode.search.id) {
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
        let list = await chrome.bookmarks.getChildren(node.id);
        // 保留收藏夹与其他收藏夹
        // TODO 不显示edge中的已删除收藏夹，但ID并不固定，只能枚举出想要展示的文件夹
        if (node.id === "0") {
          list = list.filter(v => rootDirs.some(s => s == v.id));
        }
        replaceTree(list);
      }
      if (settingStore.backLastPath) {
        setAsStart(data.navigator, data.bookmarkTree);
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
      console.error(e)
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
    if (selectStatus()) {
      cutNodes.length = 0;
      cutNodes.push(...data.selectNodes);
      data.selectNodes.length = 0;
    } else {
      if (cutNodes.length === 1 && cutNodes[0]?.id === node.id) {
        cutNodes.length = 0;
      } else {
        cutNodes.length = 0;
        cutNodes.push(node);
      }
    }
  }

  const paste = async (node: TreeNode) => {
    let idx = data.bookmarkTree.findIndex(value => value.id === node.id);
    for (let cutNode of cutNodes) {
      await chrome.bookmarks.move(cutNode.id, {
        parentId: node.url ? node.parentId : node.id,
        index: node.url ? idx : undefined
      });
    }
    cutNodes.length = 0;
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

  const inSelectNodeIdx = (item: TreeNode) => data.selectNodes.findIndex(v => v.id === item.id);
  const isInSelectNode = (item: TreeNode) => inSelectNodeIdx(item) !== -1;
  const selectStatus = () => data.selectNodes.length > 0;

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
    cutNodes,
    isInSelectNode,
    cut,
    paste,
    inSelectNodeIdx,
    selectStatus
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