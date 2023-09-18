import {inject} from "vue";
import {PROVIDE_USE_MESSAGE_KEY} from "@/util/constants";

export const useMessage = () => inject<(s: string) => void>(PROVIDE_USE_MESSAGE_KEY);