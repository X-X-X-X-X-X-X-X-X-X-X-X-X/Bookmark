<script setup lang="ts">
import { useAppData } from "@/util/useAppData";
import { onMounted, onUnmounted } from "vue";


let {data, closeSearch, onSearch} = useAppData();

onUnmounted(async () => {
  closeSearch()
})

onMounted(() => {
  let searchEl = document.getElementById("search")! as HTMLInputElement;
  searchEl.focus();
})

</script>

<template>
  <input id="search" v-model="data.search"
         :onkeyup="onSearch"
         :disabled="data.selectNodes.length > 0"
         class="box-border bg-transparent outline-0 px-1 h-full w-full" type="text">
</template>

<style scoped>

</style>