<template>
  <n-config-provider :theme="theme">
    <router-view v-slot="{ Component }">
      <!--      keep-alive会导致有纵向滚动条的页面切换回来多出一个滚动条的宽度。。。。不加又会有一点闪屏-->
      <!--      <keep-alive>-->
      <component :is="Component"/>
      <!--      </keep-alive>-->
    </router-view>
  </n-config-provider>
</template>


<style scoped>
</style>
<script setup lang="ts">
import {darkTheme, NConfigProvider, useOsTheme} from "naive-ui";
import {computed, toRefs, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useSettingStore} from "@/store/settingStore";

let osTheme = useOsTheme();
let theme = computed(() => osTheme.value === "dark" ? darkTheme : null);
let settingStore = useSettingStore();
let {locale} = useI18n({useScope: "global"});
let {language} = toRefs(settingStore);
watch(language, (i: any) => {
  locale.value = i;
}, {
  immediate: true
});
</script>