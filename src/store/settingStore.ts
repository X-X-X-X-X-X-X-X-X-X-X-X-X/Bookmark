import {defineStore} from "pinia";
import {useI18n} from "vue-i18n";

export let useSettingStore = defineStore("settingStore", {
    state() {
        return {
            columnWidth: 13,
            displayMode: "h",
            openUrlMode: "front",
            hoverEnterFolderMs: 0,
            language: "zh",
            enableFrequentlyUsedBookmarks: true,
            enableSmoothScroll: true,
            enableAnimation: true,
            layoutGap: 16,
            fontSize: 14,
            fontFamily: "initial",
            fixedHeight: true,
            middleMouseBackgroundOpen: false,
            hiddenScrollBar: false,
        }
    }
});



