import {type FunctionalComponent} from "@vue/runtime-core";
import type {Component, DefineComponent, Ref} from "vue";

export type TreeNode = chrome.bookmarks.BookmarkTreeNode & {
    count?: number,
    active?: boolean,
    isNavigator?: boolean,
};


export type ConfirmDialogOptions = Partial<{
    title: string | Ref<string>,
    content: Component,
    type: "info" | "warning",
    onOk: () => void,
}>

export interface Menu {
    name?: string | Ref<string>
    disable?: boolean | Ref<boolean>
    icon?: FunctionalComponent,
    click?: (contentShow: Ref<boolean>) => FunctionalComponent | DefineComponent | Component | void,
    contentCloseEvent?: () => void
}

export interface AppData {
    bookmarkTree: TreeNode[],
    navigator: TreeNode[],
}

export type ContextMenuInject = {
    show: Ref<boolean>
    comp: Ref<Component>
}