import {useSettingStore} from "@/store/settingStore";
import {computed} from "vue";
export const contentMaxHeight = computed(() => {
    let settingStore = useSettingStore();
    return `${settingStore.fixedHeight ? "" : "max-"}height: calc(640px - 8rem)`;
})