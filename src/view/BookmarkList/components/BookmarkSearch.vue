<script setup lang="ts">
import {onMounted, onUnmounted, reactive} from "vue";
import {useAppData} from "@/util/useAppData";

const status = reactive({
  searchInput: ""
})
let {data, clickBookmark, replaceTree, specialTreeNode} = useAppData();
const search = (() => {
  let queue: number[] = [];
  return async function (this: HTMLInputElement) {
    const toSearch = async () => {
      if (data) {
        if (this.value !== '') {
          replaceTree(await chrome.bookmarks.search(this.value));
          if (data.navigator[data.navigator.length - 1].id !== specialTreeNode.search.id) {
            data.navigator.push(specialTreeNode.search)
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
})

onMounted(() => {
  document.getElementById("search")?.focus();
})

</script>

<template>
  <input id="search" v-model="status.searchInput"
         :onkeyup="search"
         class="box-border bg-transparent outline-0 px-1 h-full w-full" type="text">
</template>

<style scoped>

</style>