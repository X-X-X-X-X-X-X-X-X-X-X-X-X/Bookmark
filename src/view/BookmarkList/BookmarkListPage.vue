<script setup lang="ts">
import BookmarkNavigator from "@/view/BookmarkList/components/BookmarkNavigator.vue";
import BookmarkList from "@/view/BookmarkList/components/BookmarkList.vue";
import BookmarkBottom from "@/view/BookmarkList/components/BookmarkBottom.vue";
import DefaultLayout from "@/layout/DefaultLayout.vue";
import { computed, onActivated, provide, reactive, ref } from "vue";
import type { Menu } from "../../../types";
import { PROVIDE_CONTEXT_MENU } from "@/util/constants";
import { useAppData } from "@/util/useAppData";
import {
  ClockCircleOutlined,
  FieldTimeOutlined,
  LeftOutlined,
  LineChartOutlined,
  SearchOutlined,
  SettingOutlined,
  StarOutlined,
} from "@ant-design/icons-vue";
import BookmarkSearch from "@/view/BookmarkList/components/BookmarkSearch.vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useSettingStore } from "@/store/settingStore";
import { createTab, resizeWidthContainer } from "@/util/appUtil";

const router = useRouter();
let { t } = useI18n();
let { clickBookmark, back, clickLastNode, data, specialTreeNode, isInNavigator, navigatorTo } =
  useAppData();
let settingStore = useSettingStore();

let isFirstActive = true;
onActivated(() => {
  if (isFirstActive) {
    isFirstActive = false;
    return;
  }
  if (data.init) {
    setTimeout(clickLastNode, 150);
  }
});

const menu = reactive<Menu[]>([
  {
    name: computed(() => t("back")),
    icon: LeftOutlined,
    click: back,
  },
  {
    name: computed(() => t("search")),
    icon: SearchOutlined,
    click: (contentShow) => {
      contentShow.value = true;
      return BookmarkSearch;
    },
  },
  {
    name: computed(() => t("frequentlyBookmark")),
    disable: computed(() => !settingStore.enableFrequentlyUsedBookmarks),
    icon: LineChartOutlined,
    click: () => {
      if (isInNavigator(specialTreeNode.frequently.id)) {
        navigatorTo(specialTreeNode.frequently)
      } else {
        clickBookmark(specialTreeNode.frequently)
      }
    },
  },
  {
    name: computed(() => t("recentlyBookmark")),
    icon: ClockCircleOutlined,
    click: () => {
       if (isInNavigator(specialTreeNode.recently.id)) {
        navigatorTo(specialTreeNode.recently)
      } else {
        clickBookmark(specialTreeNode.recently)
      }
    },
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
          path: "/setting",
        });
      });
    },
  },
  {
    name: computed(() => t("bookmarkManager")),
    icon: StarOutlined,
    click: () => {
      createTab("chrome://bookmarks");
    },
  },
]);

const contextMenuShow = ref(false);
const menuComp = ref<any>(null);

provide(PROVIDE_CONTEXT_MENU, {
  show: contextMenuShow,
  comp: menuComp,
});
</script>

<template>
  <DefaultLayout>
    <template #top>
      <BookmarkNavigator />
    </template>
    <!--确保初始化完成，否则会读取不到数据导致错误...-->
    <BookmarkList v-if="data.init" />
    <template #bottom>
      <BookmarkBottom :menu="menu"></BookmarkBottom>
    </template>
    <component @remove="contextMenuShow = false" v-if="contextMenuShow" :is="menuComp"></component>
  </DefaultLayout>
</template>

<style scoped></style>
