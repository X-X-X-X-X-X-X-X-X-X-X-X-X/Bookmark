import {type FunctionalComponent} from "@vue/runtime-core";
import type {Component, DefineComponent, Ref} from "vue";

type TreeNode = chrome.bookmarks.BookmarkTreeNode & {
    count?: number
};

interface Menu {
    disable?: boolean | Ref<boolean>
    icon?: FunctionalComponent,
    click?: (contentShow: Ref<boolean>) => FunctionalComponent | DefineComponent | Component | void,
    contentCloseEvent?: () => void
}

interface AppData {
    bookmarkTree: TreeNode[],
    navigator: TreeNode[],
}