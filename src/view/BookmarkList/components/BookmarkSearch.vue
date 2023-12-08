<script setup lang="ts">
import {onMounted, onUnmounted, reactive} from "vue";
import {useAppData} from "@/util/useAppData";
import {useSettingStore} from "@/store/settingStore";

const status = reactive({
  searchInput: ""
})

let {data, clickBookmark, replaceTree, getLastNode, specialTreeNode} = useAppData();

let queue: number[] = [];

let settingStore = useSettingStore();

const search = (() => {
  return async function (this: HTMLInputElement) {
    const toSearch = async () => {
      if (data) {
        if (this.value !== '') {
          replaceTree(await chrome.bookmarks.search(this.value), "search");
          if (getLastNode().id !== specialTreeNode.search.id) {
            data.navigator.push(specialTreeNode.search)
          }
        }
      }
    }
    let timeout = setTimeout(toSearch, settingStore.delaySearch);
    queue.push(timeout);
    if (queue.length > 1) {
      clearTimeout(queue.shift());
    }
  }
})();


onUnmounted(async () => {
  status.searchInput = '';
  if (data) {
    let idx = data.navigator.findIndex(v => v.id === specialTreeNode.search.id);
    if (idx !== -1) {
      let lastNode = data.navigator[idx - 1];
      if (idx > 1) {
        --idx;
      }
      data.navigator.splice(idx);
      await clickBookmark(lastNode);
    }
  }
  queue.forEach(clearTimeout);
})

onMounted(() => {
  let searchEl = document.getElementById("search")! as HTMLInputElement;
  searchEl.focus();
})

</script>

<template>
  <input id="search" v-model="status.searchInput"
         :onkeyup="search"
         class="box-border bg-transparent outline-0 px-1 h-full w-full" type="text">
</template>

<style scoped>

</style>