<script setup lang="ts">
import {nextTick, onMounted, ref} from "vue";
import {resizeMinHeight} from "@/util/appUtil";

const show = ref(false);
const close = () => {
  show.value = false;
}
const open = () => {
  show.value = true;
  nextTick(() => {
    let element = document.querySelector("#dialog")!;
    resizeMinHeight(element.scrollHeight + 30);
  })
}

defineExpose({
  close,
  open
})
</script>

<template>
  <div class="w-screen break-all h-screen fixed left-0 top-0 flex flex-col justify-center items-center z-50 text-color"
       v-if="show">
    <div class="absolute bg-black opacity-30  w-full h-full -z-10" @click="close"></div>
    <div id="dialog" class="bg-color border w-[90vw] max-w-[20rem] text-center max-h-screen overflow-hidden">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>

</style>