import {inject} from "vue";
import {PROVIDE_CONFIRM_DIALOG} from "@/util/constants";
import type {ConfirmDialogOptions} from "../../../../../types";


type UseDialogOptions = {
    props: Partial<ConfirmDialogOptions>,
    open: () => void,
}

export const useConfirmDialog = () => {
    let dialog = inject<UseDialogOptions>(PROVIDE_CONFIRM_DIALOG);
    const create = (options: ConfirmDialogOptions) => {
        Object.assign(dialog!.props, {
            type: null,
            hiddenCancel: false,
            ...options
        });
        dialog?.open();
    }
    return {
        create
    }
}