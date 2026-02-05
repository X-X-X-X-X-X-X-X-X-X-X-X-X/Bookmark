import { useSettingStore } from "@/store/settingStore";
import { storageGet, storageSet } from "@/util/storage";
import { PROVIDE_APP_DATA_KEY, SETTING_DATA_KEY } from "@/util/constants";
import { type App, reactive, toRefs, watch } from "vue";
import { useOsTheme } from "naive-ui";
import { i18n } from "@/i18n/i18n";
import type { AppData } from "../../types";

function wheelListener(event: WheelEvent) {
  // /*防止两个滚动条互相争抢*/
  if (
    document.documentElement.scrollHeight <= document.documentElement.clientHeight ||
    // 误差为1可能为系统缩放导致字体大小出现精度问题，当然这个解决办法并不是很好
    document.documentElement.scrollHeight - document.documentElement.clientHeight <= 1
  ) {
    let { enableSmoothScroll } = useSettingStore();
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

export const isFirefox = async () => {
  //@ts-ignore
  let browserInfo = await chrome.runtime.getBrowserInfo?.()
  return browserInfo?.name?.toLowerCase?.() === "firefox"
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
  let { displayMode, layoutGap, fontSize, fontFamily, hiddenScrollBar, themeMode } = toRefs(settingStore);
  watch(displayMode, (v: string) => {
    if (v === "h") {
      registerHorizontalScrollEvent();
    } else {
      unRegisterHorizontalScrollEvent();
    }
  }, {
    immediate: true
  });
  let html = document.querySelector("html")!;
  watch(layoutGap, value => {
    html.style.fontSize = value + "px";
  }, { immediate: true })
  watch(fontSize, value => {
    document.body.style.fontSize = value + "px";
  }, { immediate: true })

  watch(fontFamily, value => {
    document.body.style.fontFamily = value || "initial";
  }, { immediate: true })
  watch(hiddenScrollBar, value => {
    if (value) {
      html.classList.add("noScrollBar");
    } else {
      html.classList.remove("noScrollBar");
    }
  }, { immediate: true });

  watch(themeMode, value => {
    initTheme();
  }, { immediate: true })

  if (settingStore.version === "") {
    isFirefox().then(res => {
      if (res) {
        // 首次安装禁用动画
        settingStore.enableAnimation = false
      }
    })
  }
}

export const resizeWidthContainer = (w?: string, h?: string) => {
  return new Promise((resolve, reject) => {
    let { enableAnimation, displayMode } = useSettingStore();
    let useDuration = enableAnimation && displayMode === "h";
    setTimeout(() => {
      let widthContainer = document.getElementById("widthContainer");
      let widthContent = document.getElementById("widthContent");
      widthContainer!.style.width = w || widthContent!.scrollWidth + "px";
      widthContainer!.style.height = h || widthContent!.scrollHeight + "px";
      setTimeout(resolve, useDuration ? 150 : 0);
    }, useDuration ? 100 : 0)
  })
}

export const resizeMinHeight = (h: number) => {
  let widthContainer = document.getElementById("widthContainer");
  let wh = widthContainer?.scrollHeight ?? 0;
  if (wh < h) {
    resizeWidthContainer(undefined, h + "px");
  }
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
  let { language } = toRefs(settingStore);
  watch(language, (i: any) => {
    i18n.global.locale.value = i;
  }, {
    immediate: true
  });
}

export const some = (...args: boolean[]) => args.some(v => v);
export const every = (...args: boolean[]) => args.every(v => v);

export const getSystemTheme = () => {
  let settingStore = useSettingStore();
  let osTheme = useOsTheme();
  let darkMode = false;
  if (settingStore.themeMode === "auto" && osTheme.value === "dark") {
    darkMode = true;
  }
  if (settingStore.themeMode === "dark") {
    darkMode = true;
  }
  return darkMode ? "dark" : "light";
}

export const initTheme = () => {
  let systemTheme = getSystemTheme();
  if (systemTheme === "dark") {
    document.querySelector("html")!.classList.add("dark");
  } else {
    document.querySelector("html")!.classList.remove("dark");
  }
}

export const fixBrowserZoom = async () => {
  let z = await chrome.tabs.getZoomSettings();
  let currentZoom = 1 / (z.defaultZoomFactor ?? 1);
  if (currentZoom !== 1) {
    //@ts-ignore
    document.querySelector("html")!.style.zoom = currentZoom;
  }
}

export const imageToBase64 = async (src: any): Promise<string> => {
  return await new Promise(resolve => {
    let image = new Image();
    image.src = src;
    image.onload = ev => {
      const canvas = document.createElement('canvas');
      let size = 128;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0, size, size);
      resolve(canvas.toDataURL("image/png"));
    }
  })
}

export const myScrollTo = (x: number, y?: number, behavior: ScrollBehavior = "smooth") => {
  if (x !== undefined) {
    window.scrollTo({
      left: x,
      behavior
    });
  }
  if (y !== undefined) {
    let sortList = document.querySelector("#sortList")! as HTMLElement;
    sortList.scrollTo({
      top: y - sortList.offsetTop,
      behavior
    })
  }
}

export const initAppData = (app: App) => {
  let data = reactive<AppData>({
    bookmarkTree: [],
    navigator: [],
    selectNodes: [],
    init: false
  })
  app.provide(PROVIDE_APP_DATA_KEY, data);
}