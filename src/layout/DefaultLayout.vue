<script setup lang="ts">
  import {provide, reactive, ref} from "vue";
  import {PROVIDE_LAYOUT_CONTEXT_MENU_FUNCTION_SET, PROVIDE_USE_MESSAGE_KEY} from "@/util/constants";
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
  provide(PROVIDE_LAYOUT_CONTEXT_MENU_FUNCTION_SET, (fn: any) => {
    contextMenuFun.value = fn;
  });

  defineExpose({
    popMessage
  })
  let settingStore = useSettingStore();
  let contextMenuFun: any = ref(() => {
  });

</script>

<template>
  <div id="widthContainer"
       class="overflow-hidden"
       :class="[settingStore.enableAnimation ? 'transition-all' : '']" @contextmenu="contextMenuFun($event)">
    <div id="widthContent" class="pt-8 pb-8 text-color w-max">
      <div class="fixed border-b top-0 z-20 h-8 w-full bg-color">
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
      <div class="fixed bottom-0 h-8 z-10 w-full border-t bg-color">
        <slot name="bottom"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>