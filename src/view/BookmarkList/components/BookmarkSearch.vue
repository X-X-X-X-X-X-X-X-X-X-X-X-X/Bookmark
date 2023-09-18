<script setup lang="ts">
import {onUnmounted, reactive} from "vue";
import {useAppData} from "@/util/useAppData";

const status = reactive({
  searchInput: ""
})
let {data, clickBookmark, replaceTree} = useAppData();
const search = (() => {
  let queue: number[] = [];
  return async function (this: HTMLInputElement) {
    const toSearch = async () => {
      if (data) {
        if (this.value !== '') {
          replaceTree(await chrome.bookmarks.search(this.value));
          if (data.navigator[data.navigator.length - 1].id !== "-1") {
            data.navigator.push({
              id: "-1",
              title: "搜索结果"
            })
          }
        }
      }
    }
    let timeout = setTimeout(toSearch, 700);
    queue.push(timeout);
    if (queue.length > 1) {
      clearTimeout(queue.shift());
    }
  }
})();


onUnmounted(async () => {
  status.searchInput = '';
  if (data) {
    let idx = data.navigator.findIndex(v => v.id === "-1");
    if (idx !== -1) {
      let lastNode = data.navigator[idx - 1];
      if (idx > 1) {
        --idx;
      }
      data.navigator.splice(idx);
      await clickBookmark(lastNode);
    }
  }
})
</script>

<template>
  <input v-model="status.searchInput"
         :onkeyup="search"
         class="box-border bg-transparent outline-0 px-1 h-full w-full" type="text">
</template>

<style scoped>

</style>