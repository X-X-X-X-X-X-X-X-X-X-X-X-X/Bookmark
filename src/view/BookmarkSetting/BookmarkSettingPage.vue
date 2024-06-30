<script setup lang="ts">
import DefaultLayout from "@/layout/DefaultLayout.vue";
import {LeftOutlined} from "@ant-design/icons-vue";
import {useRouter} from "vue-router";
import {NButton, NInput, NInputNumber, NRadioButton, NRadioGroup, NSelect, NSlider, NSpace, NSwitch} from "naive-ui";
import {useSettingStore} from "@/store/settingStore";
import {FREQUENTLY_USED_BOOKMARKS_KEY} from "@/util/constants";
import {storageSet} from "@/util/storage";
import {computed, h, onMounted, reactive, ref} from "vue";
import {useI18n} from "vue-i18n";
import {contentMaxHeight} from "@/util/style";
//@ts-ignore
import fmt from "json-format"
import {useConfirmDialog} from "@/view/BookmarkList/components/dialog/useDialog";
import pay from "../../../screenshot/pay1.png";
import {imageToBase64} from "@/util/appUtil";

let {t} = useI18n();
let router = useRouter();
let settingStore = useSettingStore();
let dialog = useConfirmDialog();

let settingJson = computed(() => fmt(settingStore.$state, {
  type: 'space',
  size: 2
}))
const layout = ref();

const importSetting = () => {
  let v = ref('');
  dialog.create({
    title: t("importSetting"),
    content() {
      return h(NInput, {
        type: "textarea",
        value: v.value,
        class: "text-left",
        rows: 5,
        onUpdateValue(val) {
          v.value = val;
        }
      })
    },
    onOk() {
      try {
        Object.assign(settingStore.$state, JSON.parse(v.value));
        layout.value.popMessage(t("importSettingSuccess"))
      } catch (e: any) {
        layout.value.popMessage(t("importSettingFail"))
      }
    }
  })
}

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


const themeMode = reactive([
  {
    value: "auto",
    label: computed(() => t("auto"))
  },
  {
    value: "light",
    label: computed(() => t("light"))
  },
  {
    value: "dark",
    label: computed(() => t("dark"))
  },
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

const message = (s: string) => layout.value.popMessage(s);

const resetFrequentlyBookmark = () => {
  storageSet(FREQUENTLY_USED_BOOKMARKS_KEY, []);
  message(t("settingFrequentlyEmptyMessage"));
}

const fontList = ref([
  {
    label: computed(() => t('defaultFont')),
    value: "initial",
    style: {
      fontFamily: "initial"
    }
  }
]);

onMounted(() => {
  chrome.fontSettings.getFontList((list) => {
    fontList.value.push(...list.map(v => ({
      label: v.displayName + " - " + v.fontId,
      value: v.fontId,
      style: {
        fontFamily: v.fontId
      }
    })))
  })
})

const changeIcon = () => {
  let fileInput = document.createElement("input");
  fileInput.setAttribute("type", "file");
  fileInput.setAttribute("accept", ".jpg, .png");
  fileInput.click();
  fileInput.onchange = ev => {
    let file = fileInput.files![0];
    const reader = new FileReader();
    reader.onload = function (e) {
      imageToBase64(e.target!.result).then(r => {
        chrome.action.setIcon({
          path: r
        }).then(() => {
          message(t("success"))
        })
        chrome.storage.local.set({
          customIcon: r
        })
      })
    };
    reader.readAsDataURL(file);
  }
}

const resetIcon = () => {
  chrome.action.setIcon({path: "bookmark.png"}).then(() => message(t("success")));
  chrome.storage.local.set({
    customIcon: ""
  })
}

</script>

<template>
  <DefaultLayout ref="layout">
    <template #top>
      <div class="font-bold flex justify-center items-center h-full leading-8">{{ t('setting') }}</div>
    </template>
    <div class="min-w-[9rem] px-2 py-1 overflow-auto w-max"
         :style="[`width: ${settingStore.columnWidth}rem`,contentMaxHeight]">
      <div class="py-1">
        <div class="mb-1">{{ t("settingColumnWidth") }}</div>
        <n-input-number v-model:value="settingStore.columnWidth" :min="2" :max="50"
                        size="small"/>
        <!--        <n-slider :min="2" :max="50" v-model:value="settingStore.columnWidth"></n-slider>-->
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("settingHoverEnter") }}</div>
        <n-slider :min="0" :max="5000" :format-tooltip="value => value + 'ms'"
                  v-model:value="settingStore.hoverEnterFolderMs"></n-slider>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("delaySearch") }}</div>
        <n-slider :min="0" :max="2000" :format-tooltip="value => value + 'ms'"
                  v-model:value="settingStore.delaySearch"></n-slider>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("settingLayoutGap") }}</div>
        <n-input-number v-model:value="settingStore.layoutGap" :step="2" :min="12" :max="30"
                        size="small"/>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("settingFontSize") }}</div>
        <n-input-number v-model:value="settingStore.fontSize" :step="2" :min="12" :max="30"
                        size="small"/>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("customFont") }}</div>
        <n-select :options="fontList" size="small" v-model:value="settingStore.fontFamily"></n-select>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("themeMode") }}</div>
        <n-radio-group size="small" v-model:value="settingStore.themeMode">
          <n-radio-button
              size="small"
              v-for="d in themeMode"
              :key="d.value"
              :value="d.value"
              :label="d.label"
          />
        </n-radio-group>
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
        <div class="mb-1">{{ t("hiddenScrollbar") }}</div>
        <div class="flex items-center">
          <n-switch class="mr-2" size="large" v-model:value="settingStore.hiddenScrollBar">
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
        <div class="mb-1">{{ t("rightClickMenu") }}</div>
        <div class="flex items-center">
          <n-switch class="mr-2" size="large" v-model:value="settingStore.rightClickMenu">
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
          <n-button @click="resetFrequentlyBookmark" type="warning"
                    size="small" ghost>
            {{ t("settingFrequentlyEmpty") }}
          </n-button>
        </div>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("settingMiddleMouse") }}</div>
        <div class="flex items-center">
          <n-switch class="mr-2" size="large" v-model:value="settingStore.middleMouseBackgroundOpen">
            <template #checked>
              {{ t("menuBackgroundOpen") }}
            </template>
            <template #unchecked>
              {{ t("settingNo") }}
            </template>
          </n-switch>
        </div>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("settingBackLastPath") }}</div>
        <div class="flex items-center">
          <n-switch class="mr-2" size="large" v-model:value="settingStore.backLastPath">
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
        <div class="mb-1">{{ t("settingDisplayMode") }}</div>
        <n-radio-group size="small"
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
        <n-radio-group size="small"
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
        >
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
        <n-space>
          <n-button @click="settingStore.$reset()" size="small" ghost>
            {{ t("settingOtherReset") }}
          </n-button>
          <n-button @click="importSetting" size="small" ghost>
            {{ t("importSetting") }}
          </n-button>
          <n-button size="small" ghost @click="changeIcon">
            {{ t("settingOtherIconSet") }}
          </n-button>
          <n-button size="small" ghost @click="resetIcon">
            {{ t("settingOtherIconReset") }}
          </n-button>
        </n-space>
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("currentSettingJson") }}</div>
        <n-input
            readonly
            :value="settingJson"
            type="textarea"
            rows="5"
        />
      </div>
      <div class="py-1">
        <div class="mb-1">{{ t("donate") }}</div>
        <img :src="pay" alt="" class="max-w-[200px] w-full">
      </div>
    </div>
    <template #bottom>
      <div class="flex">
        <div class="h-8 w-8 flex justify-center items-center bg-color hover-color cursor-pointer"
             @click="router.back()">
          <Component :is="LeftOutlined"></Component>
        </div>
      </div>
    </template>
  </DefaultLayout>
</template>

<style>
</style>