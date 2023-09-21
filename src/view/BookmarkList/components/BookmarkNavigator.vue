<script setup lang="ts">
import {storageSet} from "@/util/storage";
import {DEFAULT_START_KEY, DEFAULT_START_WIDTH_KEY} from "@/util/constants";
import type {TreeNode} from "../../../../types";
import {useAppData} from "@/util/useAppData";
import {useMessage} from "@/util/useMessage";
import {useI18n} from "vue-i18n";

let {data, clickBookmark} = useAppData();
let message = useMessage();
let {t} = useI18n();

const navigatorTo = (node: TreeNode) => {
  //设为默认目录
  if (node.id === data.navigator[data.navigator.length - 1].id) {
    //不是搜索结果页
    if (node.id !== "-1") {
      storageSet(DEFAULT_START_KEY, node);
      message?.(t("setDefaultStartMessage", {
        msg: node.title
      }))
    }
  } else {
    let index = data.navigator.findIndex(v => v.id === node.id);
    index === 0 ? index = 1 : null;
    data.navigator.splice(index);
    clickBookmark(node);
  }
}

</script>

<template>
  <div
      class="font-bold justify-end flex whitespace-nowrap w-full h-full">
    <div
        class="flex cursor-pointer justify-center px-2 h-full items-center flex-1 border-r last:border-r-0 hover:bg-gray-100 dark:hover:bg-[#333]"
        v-for="item in data.navigator"
        @click="navigatorTo(item)">
      {{ item.title }}
    </div>
  </div>
</template>

<style scoped>

</style>