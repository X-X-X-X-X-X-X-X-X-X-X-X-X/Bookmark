<script setup lang="ts">
import BookmarkNavigator from "@/view/BookmarkList/components/BookmarkNavigator.vue";
import BookmarkList from "@/view/BookmarkList/components/BookmarkList.vue";
import BookmarkBottom from "@/view/BookmarkList/components/BookmarkBottom.vue";
import DefaultLayout from "@/layout/DefaultLayout.vue";
import {computed, onActivated, onMounted, provide, reactive, ref} from "vue";
import type {Menu} from "../../../types";
import {DEFAULT_START_DATA_KEY, PROVIDE_CONTEXT_MENU} from "@/util/constants";
import {useAppData} from "@/util/useAppData";
import {ClockCircleOutlined, LeftOutlined, SearchOutlined, SettingOutlined, StarOutlined} from "@ant-design/icons-vue";
import BookmarkSearch from "@/view/BookmarkList/components/BookmarkSearch.vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useSettingStore} from "@/store/settingStore";
import {storageGet, storageSet} from "@/util/storage";
import {createTab, resizeWidthContainer} from "@/util/appUtil";

const router = useRouter();
let {t} = useI18n();
let {clickBookmark, back, clickLastNode, data, specialTreeNode, getLastNode} = useAppData();
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
  if (data.init) {
    setTimeout(clickLastNode, 150);
  }
});

const menu = reactive<Menu[]>([
  {
    name: computed(() => t("back")),
    icon: LeftOutlined,
    click: back
  },
  {
    name: computed(() => t("search")),
    icon: SearchOutlined,
    click: (contentShow) => {
      contentShow.value = true;
      return BookmarkSearch;
    }
  },
  {
    name: computed(() => t("frequentlyBookmark")),
    disable: computed(() => !settingStore.enableFrequentlyUsedBookmarks),
    icon: ClockCircleOutlined,
    click: () => {
      if (getLastNode().id !== specialTreeNode.frequently.id) {
        clickBookmark(specialTreeNode.frequently);
      }
    }
  },
  {
    name: computed(() => t("setting")),
    icon: SettingOutlined,
    click: () => {
      let restoreWidth;
      if (!settingStore.fixedWidth) {
        restoreWidth = settingStore.columnWidth + "rem";
      }
      resizeWidthContainer(restoreWidth).then(() => {
        router.push({
          path: "/setting"
        })
      })
    }
  },
  {
    name: computed(() => t("bookmarkManager")),
    icon: StarOutlined,
    click: () => {
      createTab("chrome://bookmarks")
    }
  }
])

const contextMenuShow = ref(false);
const menuComp = ref<any>(null);

provide(PROVIDE_CONTEXT_MENU, {
  show: contextMenuShow,
  comp: menuComp
})

</script>

<template>
  <DefaultLayout>
    <template #top>
      <BookmarkNavigator/>
    </template>
    <BookmarkList v-if="data.init"/>
    <template #bottom>
      <BookmarkBottom :menu="menu"></BookmarkBottom>
    </template>
    <component @remove="contextMenuShow = false" v-if="contextMenuShow" :is="menuComp"></component>
  </DefaultLayout>
</template>

<style scoped>

</style>