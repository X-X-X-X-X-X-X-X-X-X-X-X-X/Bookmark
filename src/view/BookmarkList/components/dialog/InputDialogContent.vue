<template>
  <div class="text-left">
    <template v-for="n in values">
      <NInput
          v-model:value="n.value.value"
          class="mb-2 last:mb-0"
          size="small"
      >
        <template #prefix>
          <span class="font-bold">{{ n.name }}</span>
        </template>
      </NInput>
    </template>
  </div>
</template>

<script lang="ts" setup>
import {NInput} from "naive-ui";
import type {Ref} from "vue";

export type InputContentValueType = {
  value: Ref<string>,
  name: string,
}

defineProps<{
  values: InputContentValueType[]
}>();
</script>