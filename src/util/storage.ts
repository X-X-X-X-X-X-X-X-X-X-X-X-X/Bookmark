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


export const updateFrequentlyUsedBookmarks = (node: TreeNode) => {
    let frequentlyUsedBookmarks = storageGet<TreeNode[]>(FREQUENTLY_USED_BOOKMARKS_KEY) || [];
    let findBookmark = frequentlyUsedBookmarks.find(v => node.id === v.id);
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
    storageSet(FREQUENTLY_USED_BOOKMARKS_KEY, frequentlyUsedBookmarks.sort((a, b) => (b.count ?? 0) - (a.count ?? 0)));
}