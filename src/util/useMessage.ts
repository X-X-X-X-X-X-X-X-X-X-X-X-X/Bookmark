import {inject, type Ref} from "vue";
import {PROVIDE_USE_MESSAGE_KEY} from "@/util/constants";

export const useMessage = () => inject<(s: string | Ref<string>) => void>(PROVIDE_USE_MESSAGE_KEY);