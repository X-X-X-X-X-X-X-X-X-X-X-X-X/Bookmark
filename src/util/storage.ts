import type {TreeNode} from "../../types";
import {FREQUENTLY_USED_BOOKMARKS_KEY} from "@/util/constants";

export const storageGet = <T = any>(key: string): T | undefined => {
    let item = localStorage.getItem(key);
    if (item) {
        return JSON.parse(item);
    }
};

export const storageSet = (key: string, data: any) => {
    return localStorage.setItem(key, JSON.stringify(data));
};


export const updateFrequentlyUsedBookmarks = (node: TreeNode, act: "add" | "del" = "add") => {
    let frequentlyUsedBookmarks = storageGet<TreeNode[]>(FREQUENTLY_USED_BOOKMARKS_KEY) || [];
    let findBookmarkIdx = frequentlyUsedBookmarks.findIndex(v => node.id === v.id);
    let findBookmark = frequentlyUsedBookmarks[findBookmarkIdx];
    if (act === "del") {
        if (findBookmark) {
            frequentlyUsedBookmarks.splice(findBookmarkIdx, 1);
        }
    } else if (act === "add") {
        if (!findBookmark) {
            findBookmark = {
                ...node,
                count: 0
            };
            frequentlyUsedBookmarks.unshift(findBookmark);
        }
        if (findBookmark.count !== undefined) {
            ++findBookmark.count;
        }
    }
    storageSet(FREQUENTLY_USED_BOOKMARKS_KEY, frequentlyUsedBookmarks.sort((a, b) => (b.count ?? 0) - (a.count ?? 0)));
}