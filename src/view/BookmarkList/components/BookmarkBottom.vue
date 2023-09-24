<script setup lang="ts">
import {type Component, reactive, toRefs} from "vue";
import {CloseOutlined} from '@ant-design/icons-vue';
import type {Menu} from "../../../../types";

defineProps<{
  menu: Menu[]
}>()

const status = reactive({
  contentShow: false
});

let contentComponent: Component | undefined;

const iconClick = (f: Menu['click']) => {
  let {contentShow} = toRefs(status);
  let comp = f?.(contentShow);
  if (comp) {
    contentComponent = comp;
  }
}
</script>

<template>
  <div class="h-full w-full flex">
    <div class="flex absolute w-full h-full left-0 top-0 dark:bg-[var(--bg-color)] bg-white" v-if="status.contentShow">
      <div class="flex-1">
        <Component :is="contentComponent"></Component>
      </div>
      <div @click="status.contentShow = false, contentComponent = undefined"
           title="关闭"
           class="flex-none w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#333] cursor-pointer ">
        <CloseOutlined/>
      </div>
    </div>
    <div
        class="h-8 w-8 flex justify-center items-center hover:bg-gray-100 dark:hover:bg-[#333] cursor-pointer"
        :title="m.name ?? ''"
        @click="iconClick(m.click)" v-for="m in menu" v-show="!m.disable">
      <component :is="m.icon"></component>
    </div>
  </div>
</template>

<style scoped>

</style>