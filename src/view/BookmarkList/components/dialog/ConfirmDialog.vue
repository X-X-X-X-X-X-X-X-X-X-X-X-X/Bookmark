<script setup lang="ts">
import Dialog from "@/view/BookmarkList/components/dialog/Dialog.vue";
import {NButton} from "naive-ui";
import {computed, provide, ref} from "vue";
import {InfoCircleOutlined, WarningOutlined} from "@ant-design/icons-vue";
import {PROVIDE_CONFIRM_DIALOG} from "@/util/constants";
import type {ConfirmDialogOptions} from "../../../../../types";
import {useI18n} from "vue-i18n";

let props = defineProps<ConfirmDialogOptions>();
const dialog = ref<InstanceType<typeof Dialog>>();
let iconMap = {
  info: InfoCircleOutlined,
  warning: WarningOutlined,
  default: null
}
const titleIcon = computed(() => iconMap[props.type || "default"]);
provide(PROVIDE_CONFIRM_DIALOG, {
  props,
  close: () => {
    dialog.value?.close();
  },
  open: () => {
    dialog.value?.open();
  }
});

let {t} = useI18n();
</script>

<template>
  <Dialog ref="dialog">
    <div class="pt-2 pb-1 px-2 font-bold text-[1.2em] ">
        <span class="relative">
          <component :is="titleIcon" class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[130%]" :class="[
              type === 'warning' ? 'text-red-600' : ''
          ]"></component>
           {{ title }}
        </span>
    </div>
    <div class="pb-2 pt-1 px-2">
      <component :is="content"></component>
    </div>
    <div class="border-t p-2">
      <n-button size="small" class="!mr-2" @click="dialog!.close">{{ t("cancel") }}</n-button>
      <n-button size="small" @click="onOk?.(), dialog!.close()" ghost>{{ t("confirm") }}</n-button>
    </div>
  </Dialog>
  <slot></slot>
</template>

<style scoped>

</style>