<script setup lang="ts">
import {type Component, h, reactive, toRef, toRefs, unref} from "vue";
import {CloseOutlined} from '@ant-design/icons-vue';
import type {Menu} from "../../../../types";
import {useI18n} from "vue-i18n";
import BookmarkSearch from "@/view/BookmarkList/components/BookmarkSearch.vue";

let props = defineProps<{
  menu: Menu[]
}>();

const status = reactive({
  contentShow: false
});

let contextShowRef = toRef(status, "contentShow");

let contentComponent: Component | undefined;

const iconClick = (f: Menu['click']) => {
  let {contentShow} = toRefs(status);
  let comp = f?.(contentShow);
  if (comp) {
    contentComponent = comp;
  }
}
let {t} = useI18n();
window.onkeyup = (e: KeyboardEvent) => {
  if (e.target === document.body) {
    let searchMenu = props.menu.find(v => v.name === t("search"))!;
    const search = (...args: Parameters<NonNullable<Menu['click']>>) => {
      let comp = searchMenu.click!(...args) as typeof BookmarkSearch;
      return h(comp, {
        input: e.key
      })
    }
    iconClick(search);
  }

}

</script>

<template>
  <div class="h-full w-full flex">
    <div class="flex absolute w-full h-full left-0 top-0 bg-color" v-if="status.contentShow">
      <div class="flex-1">
        <Component :is="contentComponent"></Component>
      </div>
      <div @click="status.contentShow = false, contentComponent = undefined"
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