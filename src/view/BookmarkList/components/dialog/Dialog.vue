<script setup lang="ts">
import {ref} from "vue";

const show = ref(false);
const close = () => {
  show.value = false;
}
const open = () => {
  show.value = true;
}

defineExpose({
  close,
  open
})
</script>

<template>
  <div class="w-screen h-screen fixed left-0 top-0 flex flex-col justify-center items-center z-50 text-color"
       v-if="show">
    <div class="absolute bg-black opacity-30  w-full h-full -z-10" @click="close"></div>
    <div>
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>

</style>