import {createI18n} from 'vue-i18n'
import zh from "@/i18n/zh";
import en from "@/i18n/en";

export const i18n = createI18n({
    locale: "zh",
    fallbackLocale: "zh",
    legacy: false,
    messages: {
        zh,
        en
    }
})