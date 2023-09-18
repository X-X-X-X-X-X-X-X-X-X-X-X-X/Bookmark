<script setup lang="ts">
import {provide, reactive} from "vue";
import {PROVIDE_USE_MESSAGE_KEY} from "@/util/constants";
import {useSettingStore} from "@/store/settingStore";

const status = reactive({
  message: "",
  messageShow: false
})


let messageCount = 0;
const popMessage = (msg: string) => {
  ++messageCount;
  status.message = msg;
  status.messageShow = true;
  setTimeout(() => {
    --messageCount;
    if (messageCount <= 0) {
      status.messageShow = false
    }
  }, 1200)
}
provide(PROVIDE_USE_MESSAGE_KEY, popMessage);

defineExpose({
  popMessage
})
let settingStore = useSettingStore();
</script>

<template>
  <div class="pt-8 pb-8 dark:bg-[var(--bg-color)] dark:text-gray-50"
       :class="settingStore.displayMode === 'h' ? 'w-max' : 'w-full'"
  >
    <div class="fixed border-b top-0 z-20 h-8 w-full dark:bg-[var(--bg-color)] bg-white">
      <div
          v-if="status.messageShow"
          class="absolute left-0 top-0 w-full min-h-full dark:bg-green-950 bg-green-100 flex items-center justify-center">
        <div class="p-1 font-bold whitespace-normal break-all text-center">
          {{ status.message }}
        </div>
      </div>
      <slot name="top"></slot>
    </div>
    <div class="w-full">
      <slot></slot>
    </div>
    <div class="fixed bottom-0 h-8 z-10 w-full border-t dark:bg-[var(--bg-color)] bg-white">
      <slot name="bottom"></slot>
    </div>
  </div>
</template>

<style scoped>
</style>