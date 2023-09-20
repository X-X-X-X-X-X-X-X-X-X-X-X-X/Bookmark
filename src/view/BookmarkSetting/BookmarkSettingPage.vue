<script setup lang="ts">
import DefaultLayout from "@/layout/DefaultLayout.vue";
import {LeftOutlined} from "@ant-design/icons-vue";
import {useRouter} from "vue-router";
import {NButton, NInputNumber, NRadioButton, NRadioGroup, NSlider, NSwitch} from "naive-ui";
import {useSettingStore} from "@/store/settingStore";
import {FREQUENTLY_USED_BOOKMARKS_KEY, SETTING_DATA_KEY} from "@/util/constants";
import {storageSet} from "@/util/storage";
import {computed, onActivated, onMounted, reactive, ref, toRef, watch} from "vue";
import {useI18n} from "vue-i18n";
import {contentMaxHeight} from "@/util/style";

let {t} = useI18n();
let router = useRouter();
let settingStore = useSettingStore();
let curWidth = ref(settingStore.columnWidth);
settingStore.$subscribe((mutation, state) => {
  storageSet(SETTING_DATA_KEY, state);
})
onActivated(() => {
  if (curWidth.value !== settingStore.columnWidth) {
    curWidth.value = settingStore.columnWidth
  }
})
const layout = ref();
const displayMode = reactive([
  {
    value: "h",
    label: computed(() => t("settingDisplayModeH"))
  },
  {
    value: 'v',
    label: computed(() => t("settingDisplayModeV"))
  }
])

const openUrlMode = reactive([
  {
    value: "front",
    label: computed(() => t("settingLinkOpenModeCurrentWindow"))
  },
  {
    value: 'back',
    label: computed(() => t("settingLinkOpenModeBackgroundWindow"))
  }
])

const language = reactive([
  {
    value: "zh",
    label: t("settingLanguageZh")
  },
  {
    value: 'en',
    label: t("settingLanguageEn")
  }
])

const resetFrequentlyBookmark = () => {
  storageSet(FREQUENTLY_USED_BOOKMARKS_KEY, []);
  layout.value.popMessage(t("settingFrequentlyEmptyMessage"));
}
const fontSizeStyle = computed(() => `font-size: ${settingStore.fontSize}px`);


onMounted(() => {
  /*......只能这样强制改变了*/
  watch(toRef(settingStore, "fontSize"), value => {
    document.querySelectorAll(".n-input__input-el").forEach(v => {
      v.setAttribute("style", `font-size: ${value}px`)
    })
  }, {
    immediate: true
  })
})

</script>

<template>
  <DefaultLayout ref="layout">
    <template #top>
      <div class="font-bold flex justify-center items-center h-full">{{ t('setting') }}</div>
    </template>
    <div class="min-w-[9rem] px-2 py-1 overflow-auto w-max" :style="[`width: ${curWidth}rem`,contentMaxHeight]">
      <div class="py-1">
        <div class="mb-1">{{ t("settingColumnWidth") }}</div>
        <n-slider :min="2" :max="50" v-model:value="settingStore.columnWidth"></n-slider>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("settingHoverEnter") }}</div>
        <n-slider :min="0" :max="5000" :format-tooltip="value => value + 'ms'"
                  v-model:value="settingStore.hoverEnterFolderMs"></n-slider>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("settingLayoutGap") }}</div>
        <n-input-number :style="fontSizeStyle" v-model:value="settingStore.layoutGap" :step="2" :min="10" :max="30"
                        size="small"/>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("settingFontSize") }}</div>
        <n-input-number :style="fontSizeStyle" v-model:value="settingStore.fontSize" :step="2" :min="12" :max="30"
                        size="small"/>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("settingSmoothScroll") }}</div>
        <div class="flex items-center">
          <n-switch class="mr-2" size="large" v-model:value="settingStore.enableSmoothScroll">
            <template #checked>
              {{ t("enable") }}
            </template>
            <template #unchecked>
              {{ t("disable") }}
            </template>
          </n-switch>
        </div>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("settingEnableAnimation") }}</div>
        <div class="flex items-center">
          <n-switch class="mr-2" size="large" v-model:value="settingStore.enableAnimation">
            <template #checked>
              {{ t("enable") }}
            </template>
            <template #unchecked>
              {{ t("disable") }}
            </template>
          </n-switch>
        </div>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("settingFixedHeight") }}</div>
        <div class="flex items-center">
          <n-switch class="mr-2" size="large" v-model:value="settingStore.fixedHeight">
            <template #checked>
              {{ t("enable") }}
            </template>
            <template #unchecked>
              {{ t("disable") }}
            </template>
          </n-switch>
        </div>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("settingFrequently") }}</div>
        <div class="flex items-center">
          <n-switch class="mr-2" size="large" v-model:value="settingStore.enableFrequentlyUsedBookmarks">
            <template #checked>
              {{ t("enable") }}
            </template>
            <template #unchecked>
              {{ t("disable") }}
            </template>
          </n-switch>
          <n-button @click="resetFrequentlyBookmark" type="warning" :style="fontSizeStyle"
                    size="small" ghost>
            {{ t("settingFrequentlyEmpty") }}
          </n-button>
        </div>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("settingDisplayMode") }}</div>
        <n-radio-group size="small" :style="fontSizeStyle"
                       v-model:value="settingStore.displayMode">
          <n-radio-button
              size="small"
              v-for="d in displayMode"
              :key="d.value"
              :value="d.value"
              :label="d.label"
          />
        </n-radio-group>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("settingLinkOpenMode") }}</div>
        <n-radio-group size="small" :style="fontSizeStyle"
                       v-model:value="settingStore.openUrlMode">
          <n-radio-button
              size="small"
              v-for="d in openUrlMode"
              :key="d.value"
              :value="d.value"
              :label="d.label"
          />
        </n-radio-group>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("settingLanguage") }}</div>
        <n-radio-group size="small" v-model:value="settingStore.language"
                       :style="fontSizeStyle">
          <n-radio-button
              size="small"
              v-for="d in language"
              :key="d.value"
              :value="d.value"
              :label="d.label"
          />
        </n-radio-group>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("settingOther") }}</div>
        <n-button @click="settingStore.$reset()" size="small" class="mr-2" ghost :style="fontSizeStyle">
          {{ t("settingOtherReset") }}
        </n-button>
      </div>
    </div>
    <template #bottom>
      <div class="flex">
        <div class="h-8 w-8 flex justify-center items-center hover:bg-gray-100 dark:hover:bg-[#333] cursor-pointer"
             @click="router.back()">
          <Component :is="LeftOutlined"></Component>
        </div>
      </div>
    </template>
  </DefaultLayout>
</template>

<style scoped>
</style>