<script setup lang="ts">
import {type Component, reactive, toRefs, unref} from "vue";
import {CloseOutlined} from '@ant-design/icons-vue';
import type {Menu} from "../../../../types";
import {useI18n} from "vue-i18n";
import {useAppData} from "@/util/useAppData";
import {useWindowKeyEvent} from "@/util/useWindowKeyEvent";

let props = defineProps<{
  menu: Menu[]
}>();

const status = reactive({
  contentShow: false
});
let contentComponent: Component | undefined;

let {selectStatus} = useAppData();

const iconClick = (f: Menu['click']) => {
  if (selectStatus()) return;
  let {contentShow} = toRefs(status);
  let comp = f?.(contentShow);
  if (comp) {
    contentComponent = comp;
  }
}
let {t} = useI18n();
let {addListener} = useWindowKeyEvent();

addListener((codes, type, e) => {
  if (type === "keyup") {
    if (selectStatus()) return;
    // 防止设置界面输入也会触发
    if (e.target !== document.body) return;
    let searchMenu = props.menu.find(v => v.name === t("search"))!;
    iconClick(searchMenu.click);
  }
})

const close = () => {
  if (!selectStatus()){
    status.contentShow = false
    contentComponent = undefined
  }
}

</script>

<template>
  <div class="h-full w-full flex">
    <div class="flex absolute w-full h-full left-0 top-0 bg-color" v-if="status.contentShow">
      <div class="flex-1">
        <Component :is="contentComponent"></Component>
      </div>
      <div @click="close"
           title="关闭"
           class="flex-none w-8 h-8 flex items-center justify-center hover-color cursor-pointer ">
        <CloseOutlined/>
      </div>
    </div>
    <div
        class="h-8 w-8 flex justify-center items-center hover-color cursor-pointer"
        :title="unref(m.name) ?? ''"
        @click="iconClick(m.click)" v-for="m in menu" v-show="!m.disable">
      <component :is="m.icon"></component>
    </div>
  </div>
</template>

<style scoped>

</style>