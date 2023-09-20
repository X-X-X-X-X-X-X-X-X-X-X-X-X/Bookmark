<script setup lang="ts">
import BookmarkNavigator from "@/view/BookmarkList/components/BookmarkNavigator.vue";
import BookmarkList from "@/view/BookmarkList/components/BookmarkList.vue";
import BookmarkBottom from "@/view/BookmarkList/components/BookmarkBottom.vue";
import DefaultLayout from "@/layout/DefaultLayout.vue";
import {computed, inject, onActivated, onBeforeMount, onMounted, reactive, type Ref} from "vue";
import type {Menu} from "../../../types";
import {PROVIDE_IS_INITIALIZED} from "@/util/constants";
import {useAppData} from "@/util/useAppData";
import {ClockCircleOutlined, LeftOutlined, SearchOutlined, SettingOutlined} from "@ant-design/icons-vue";
import BookmarkSearch from "@/view/BookmarkList/components/BookmarkSearch.vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useSettingStore} from "@/store/settingStore";

const router = useRouter();
let {clickBookmark, back, clickLastNode, data} = useAppData();
let {t} = useI18n();

let init = inject<Ref<boolean>>(PROVIDE_IS_INITIALIZED);
onActivated(() => {
  setTimeout(() => {
    if (init!.value) {
      clickLastNode();
    }
  })
});

let settingStore = useSettingStore();
const menu = reactive<Menu[]>([
  {
    icon: LeftOutlined,
    click: back
  },
  {
    icon: SearchOutlined,
    click: (contentShow) => {
      contentShow.value = true;
      return BookmarkSearch;
    }
  },
  {
    disable: computed(() => !settingStore.enableFrequentlyUsedBookmarks),
    icon: ClockCircleOutlined,
    click: () => {
      if (data.navigator[data.navigator.length - 1].id !== "-2") {
        clickBookmark(reactive({
          title: computed(() => t("frequentlyBookmark")),
          id: "-2"
        }));
      }
    }
  },
  {
    icon: SettingOutlined,
    click: () => {
      router.push({
        path: "/setting"
      })
    }
  }
])
</script>

<template>
  <DefaultLayout>
    <template #top>
      <BookmarkNavigator/>
    </template>
    <BookmarkList/>
    <template #bottom>
      <BookmarkBottom :menu="menu"></BookmarkBottom>
    </template>
  </DefaultLayout>
</template>

<style scoped>

</style>