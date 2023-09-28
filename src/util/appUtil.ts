import {useSettingStore} from "@/store/settingStore";
import {storageGet, storageSet} from "@/util/storage";
import {SETTING_DATA_KEY} from "@/util/constants";
import {toRefs, watch} from "vue";
import {useI18n} from "vue-i18n";

function wheelListener(event: WheelEvent) {
    /*防止两个滚动条互相争抢*/
    if (document.documentElement.scrollHeight <= document.documentElement.clientHeight) {
        let {enableSmoothScroll} = useSettingStore();
        window.scrollTo({
            behavior: enableSmoothScroll ? "smooth" : "auto",
            top: window.scrollY,
            left: window.scrollX + event.deltaY * (+enableSmoothScroll + 1)
        });
    }
}

export const registerHorizontalScrollEvent = () => {
    window.addEventListener('wheel', wheelListener, {
        passive: false
    });
}

export const unRegisterHorizontalScrollEvent = () => {
    window.removeEventListener("wheel", wheelListener);
}

export const registerMouseRightClickEvent = () => {
    window.oncontextmenu = function (e) {
        e.preventDefault();
    }
}

export const initStore = () => {
    let settingStore = useSettingStore();
    let localSetting = storageGet(SETTING_DATA_KEY);
    if (localSetting) {
        Object.assign(settingStore.$state, localSetting);
    }
    //如果状态变更，存储到LocalStorage
    settingStore.$subscribe((mutation, state) => {
        storageSet(SETTING_DATA_KEY, state);
    })
    let {displayMode, layoutGap, fontSize} = toRefs(settingStore);
    watch(displayMode, (v: string) => {
        if (v === "h") {
            registerHorizontalScrollEvent();
        } else {
            unRegisterHorizontalScrollEvent();
        }
    }, {
        immediate: true
    });
    watch(layoutGap, value => {
        let html = document.querySelector("html");
        if (html) {
            html.style.fontSize = value + "px";
        }
    }, {
        immediate: true
    })
    watch(fontSize, value => {
        document.body.style.fontSize = value + "px";
        document.body.style.fontFamily = "initial";
    }, {
        immediate: true
    })
}

export const resizeWidthContainer = (s?: string) => {
    return new Promise((resolve, reject) => {
        let {enableAnimation, displayMode} = useSettingStore();
        let useDuration = enableAnimation && displayMode === "h";
        setTimeout(() => {
            let widthContainer = document.getElementById("widthContainer");
            let widthContent = document.getElementById("widthContent");
            widthContainer!.style.width = s || widthContent!.scrollWidth + "px";
            setTimeout(resolve, useDuration ? 150 : 0);
        }, useDuration ? 100 : 0)
    })
}


export const createTab = async (url: string, active?: boolean) => {
    let settingStore = useSettingStore();
    await chrome.tabs.create({
        active: active ?? settingStore.openUrlMode === "front",
        url,
    })
}
export const initI18n = () => {
    let settingStore = useSettingStore();
    let {locale} = useI18n({useScope: "global"});
    let {language} = toRefs(settingStore);
    watch(language, (i: any) => {
        locale.value = i;
    }, {
        immediate: true
    });
}