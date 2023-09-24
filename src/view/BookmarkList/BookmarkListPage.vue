<script setup lang="ts">
import BookmarkNavigator from "@/view/BookmarkList/components/BookmarkNavigator.vue";
import BookmarkList from "@/view/BookmarkList/components/BookmarkList.vue";
import BookmarkBottom from "@/view/BookmarkList/components/BookmarkBottom.vue";
import DefaultLayout from "@/layout/DefaultLayout.vue";
import {computed, inject, onActivated, onMounted, reactive, type Ref} from "vue";
import type {Menu} from "../../../types";
import {DEFAULT_START_DATA_KEY, PROVIDE_IS_INITIALIZED} from "@/util/constants";
import {useAppData} from "@/util/useAppData";
import {ClockCircleOutlined, LeftOutlined, SearchOutlined, SettingOutlined, StarOutlined} from "@ant-design/icons-vue";
import BookmarkSearch from "@/view/BookmarkList/components/BookmarkSearch.vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useSettingStore} from "@/store/settingStore";
import {storageGet, storageSet} from "@/util/storage";
import {createTab, resizeWidthContainer} from "@/util/appUtil";

const router = useRouter();
let {clickBookmark, back, clickLastNode, data} = useAppData();
let {t} = useI18n();
let init = inject<Ref<boolean>>(PROVIDE_IS_INITIALIZED);
let settingStore = useSettingStore();
onMounted(() => {
  /*防止闪烁*/
  data.bookmarkTree.length = 0;
  data.bookmarkTree.push(...(storageGet(DEFAULT_START_DATA_KEY) || []))
  setTimeout(() => {
    storageSet(DEFAULT_START_DATA_KEY, data.bookmarkTree);
  }, 150)
})

onActivated(() => {
  if (init!.value) {
    setTimeout(clickLastNode, 150);
  }
});

const menu = reactive<Menu[]>([
  {
    name: "返回",
    icon: LeftOutlined,
    click: back
  },
  {
    name: "搜索",
    icon: SearchOutlined,
    click: (contentShow) => {
      contentShow.value = true;
      return BookmarkSearch;
    }
  },
  {
    name: "常用书签",
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
    name: "设置",
    icon: SettingOutlined,
    click: () => {
      resizeWidthContainer(settingStore.columnWidth + "rem").then(() => {
        router.push({
          path: "/setting"
        })
      })
    }
  },
  {
    name: "书签管理器",
    icon: StarOutlined,
    click: () => {
      createTab("edge://favorites")
    }
  }
])
</script>

<template>
  <DefaultLayout>
    <template #top>
      <BookmarkNavigator/>
    </template>
    <BookmarkList v-if="init"/>
    <template #bottom>
      <BookmarkBottom :menu="menu"></BookmarkBottom>
    </template>
  </DefaultLayout>
</template>

<style scoped>

</style>