import {computed, reactive} from "vue";
import {darkTheme, enUS, type GlobalThemeOverrides, useOsTheme, zhCN} from "naive-ui";
import {useSettingStore} from "@/store/settingStore";

export const useNaiveUI = () => {
    let settingStore = useSettingStore();
    let naiveLocale = computed(() => {
        return settingStore.language === "zh" ? zhCN : enUS;
    })
    let fontSize = computed(() => settingStore.fontSize + "px");
    const themeOverrides: GlobalThemeOverrides = reactive({
        common: {
            fontSizeSmall: fontSize,
            fontSize: fontSize,
            fontSizeLarge: fontSize,
            fontSizeHuge: fontSize,
            fontSizeMedium: fontSize,
            fontSizeTiny: fontSize,
            fontSizeMini: fontSize,
        },
        InternalSelectMenu: {
            optionHeightMedium: "28px",
        }
    })
    let osTheme = useOsTheme();
    darkTheme.common.popoverColor = "var(--bg-color)";
    let theme = computed(() => osTheme.value === "dark" ? darkTheme : null);
    return {
        naiveLocale,
        themeOverrides,
        theme
    }
}