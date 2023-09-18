import {createRouter, createWebHashHistory} from "vue-router";
import BookmarkListPage from "@/view/BookmarkList/BookmarkListPage.vue";

export let router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: "/",
            component: BookmarkListPage
        },
        {
            path: "/setting",
            component: () => import("@/view/BookmarkSetting/BookmarkSettingPage.vue")
        }
    ]
});




