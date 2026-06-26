import { i18n } from "@/i18n/i18n";
import { useSettingStore } from "@/store/settingStore";
import { createTab, isFirefox, myScrollTo, resizeWidthContainer } from "@/util/appUtil";
import {
  DEFAULT_START_DATA_KEY,
  DEFAULT_START_KEY,
  FREQUENTLY_USED_BOOKMARKS_KEY,
  PROVIDE_APP_DATA_KEY,
  RESTORE_POSITION_X_KEY,
  RESTORE_POSITION_Y_KEY,
  SEPARATOR
} from "@/util/constants";
import { storageGet, storageSet, updateFrequentlyUsedBookmarks } from "@/util/storage";
import { sort } from "radash";
import { computed, inject, nextTick, reactive, toRefs, watch } from "vue";
import type { AppData, TreeNode } from "../../types";
import debounce from "debounce";
let resotreStatus = false;
const cutNodes = reactive<TreeNode[]>([]);
export let allBookmark: {
  [k: string]: TreeNode
} = reactive({});

export const getTree = async () => {
  return await chrome.bookmarks.getTree();
}

export const setAllBookmark = (bookmarks: TreeNode[]) => {
  const getBookmark = (findBookmarks: TreeNode[], parentPath: TreeNode[] = []) => {
    findBookmarks.forEach(b => {
      allBookmark[b.id] = b;
      allBookmark[b.id].fullPath = parentPath;
      if (b.children) {
        getBookmark(b.children, [...parentPath, { title: b.title, id: b.id }])
      }
    })
  }
  allBookmark = {};
  getBookmark(bookmarks);
}

export const updateAllBookmark = async () => {
  setAllBookmark(await getTree());
}

export type SpecialTreeNodeKey = "search" | "frequently" | "recently";

export type SpecialTreeNode = {
  [k in SpecialTreeNodeKey]: TreeNode
}

export const useAppData = () => {
  let data = inject<AppData>(PROVIDE_APP_DATA_KEY)!;
  let settingStore = useSettingStore();

  const onSearch = debounce(async () => {
    if (!data.search) {
      return;
    };
    replaceTree(await chrome.bookmarks.search(data.search), "search");
    if (getLastNode().id !== specialTreeNode.search.id) {
      data.navigator.push(specialTreeNode.search)
    }
  }, settingStore.delaySearch)

  const closeSearch = () => {
    data.search = '';
    if (getLastNode().id === specialTreeNode.search.id) {
      data.navigator.pop();
      clickLastNode()
    }
  }

  /*特殊节点*/
  const specialTreeNode: SpecialTreeNode = reactive({
    search: {
      id: "-1",
      title: computed(() => i18n.global.t("searchResult")),
    },
    frequently: {
      id: "-2",
      title: computed(() => i18n.global.t("frequentlyBookmark")),
    },
    recently: {
      id: "-3",
      title: computed(() => i18n.global.t("recentlyBookmark")),
    }
  })

  const isSpecialTreeNode = (id: string) => {
    return Object.values(specialTreeNode).some(v => v.id === id);
  }

  const getSpecialTreeNodeKey = (id: string) => {
    return Object.keys(specialTreeNode).find((v) => specialTreeNode[v as SpecialTreeNodeKey].id === id) as SpecialTreeNodeKey;
  }

  const replaceTree = async (treeNodes: TreeNode[], type?: string) => {
    treeNodes.forEach(v => {
      v.type = type ?? ""
      if (!v.url && v.title === SEPARATOR) {
        v.isSeparator = true;
      }
    });
    data.bookmarkTree.splice(0, data.bookmarkTree.length, ...treeNodes);
    await nextTick()
    await resizeWidthContainer();
    if (settingStore.backLastPath && !resotreStatus) {
      resotreStatus = true;
      let sx = storageGet(RESTORE_POSITION_X_KEY) ?? 0;
      let sy = storageGet(RESTORE_POSITION_Y_KEY) ?? 0;
      myScrollTo(sx, sy, sx > 0 ? 'smooth' : "instant")
    }
  }
  const clickBookmark = async (node: TreeNode, active?: boolean) => {
    if (node.isSeparator) return
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
          await replaceTree(refreshFrequentlyUsedBookmarks, "frequently");
        } else {
          const index = data.navigator.findIndex(v => v.id === specialTreeNode.frequently.id)
          if (index !== -1) {
            data.navigator.splice(index, 1);
          }
          await clickLastNode();
          return;
        }
      } else if (node.id === specialTreeNode.recently.id) {
        let list = sort(Object.values(allBookmark).filter(v => v.url), a => a.dateAdded || 0, true)
        replaceTree(list.slice(0, 100), "recently")
        await nextTick()
      }
      // 搜索结果
      else if (node.id === specialTreeNode.search.id) {

      } else {
        let nodeId = node.id;
        // 兼容firfox
        if (nodeId === "0") {
          if (await isFirefox()) {
            nodeId = "root________"
            data.isFirefox = true;
          }
        }
        let list = await chrome.bookmarks.getChildren(nodeId);
        await replaceTree(list);
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
      await clickLastNode();
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
  const isInNavigator = (id: string) => data.navigator.some(v => v.id === id);

  return {
    updateNode,
    data,
    getLastNode,
    clickBookmark,
    getSpecialTreeNodeKey,
    specialTreeNode,
    isSpecialTreeNode,
    isInNavigator,
    back,
    navigatorTo,
    replaceTree,
    clickLastNode,
    cutNodes,
    isInSelectNode,
    cut,
    paste,
    inSelectNodeIdx,
    selectStatus,
    onSearch,
    closeSearch
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