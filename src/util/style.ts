import {useSettingStore} from "@/store/settingStore";
import {computed} from "vue";

export const contentMaxHeightAndWidth = computed(() => {
    let settingStore = useSettingStore();
    let styles = [`${settingStore.fixedHeight ? "" : "max-"}height: calc(640px - 8rem)`];
    if (settingStore.fixedWidth) {
        styles.push("width: 800px!important");
    }
    return styles.join(";");
})