<script setup lang="ts">
import {NInput} from "naive-ui";
import type {Ref} from "vue";

let props = defineProps<{
  v: Ref<string>,
  prefix: string
}>();
let {v, prefix} = props;
</script>

<template>
  <NInput v-model:value="v" size="small">
    <template #prefix>
      <span class="font-bold">{{ prefix }}</span>
    </template>
  </NInput>
</template>

<style scoped>

</style>