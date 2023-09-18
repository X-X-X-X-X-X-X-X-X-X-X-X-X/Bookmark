<script setup lang="ts">
import BookmarkNavigator from "@/view/BookmarkList/components/BookmarkNavigator.vue";
import BookmarkList from "@/view/BookmarkList/components/BookmarkList.vue";
import BookmarkBottom from "@/view/BookmarkList/components/BookmarkBottom.vue";
import DefaultLayout from "@/layout/DefaultLayout.vue";
import {computed, onActivated, onBeforeMount, provide, reactive, ref, toRef} from "vue";
import type {AppData, Menu} from "../../../types";
import {DEFAULT_START_KEY, PROVIDE_APP_DATA_KEY} from "@/util/constants";
import {useAppData} from "@/util/useAppData";
import {storageGet} from "@/util/storage";
import {ClockCircleOutlined, LeftOutlined, SearchOutlined, SettingOutlined} from "@ant-design/icons-vue";
import BookmarkSearch from "@/view/BookmarkList/components/BookmarkSearch.vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useSettingStore} from "@/store/settingStore";

let data = reactive<AppData>({
  bookmarkTree: [],
  navigator: [],
})
provide(PROVIDE_APP_DATA_KEY, data);
const router = useRouter();
let {clickBookmark, back} = useAppData(data);

let {t} = useI18n({useScope: "global"});

onBeforeMount(async () => {
  let all = await chrome.bookmarks.getTree();
  all[0].title = t("rootTitle");
  data.navigator.push(all[0]);
  let defaultStartNode = storageGet(DEFAULT_START_KEY);
  if (defaultStartNode !== undefined) {
    //优化渲染割裂感
    await clickBookmark(defaultStartNode);
    Object.assign(defaultStartNode, (await chrome.bookmarks.get(defaultStartNode.id))[0]);
  } else {
    data.bookmarkTree.push(...all[0].children ?? []);
  }
  // onActivated(clickLastNode);
})
let settingStore = useSettingStore();
let disableFrequentlyUsedBookmarks = computed(() => !settingStore.enableFrequentlyUsedBookmarks);

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
    disable: disableFrequentlyUsedBookmarks,
    icon: ClockCircleOutlined,
    click: () => {
      if (data.navigator[data.navigator.length - 1].id !== "-2") {
        clickBookmark({
          title: t("frequentlyBookmark"),
          id: "-2"
        });
      }
    }
  },
  {
    icon: SettingOutlined,
    click: () => router.push({
      path: "/setting"
    })
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