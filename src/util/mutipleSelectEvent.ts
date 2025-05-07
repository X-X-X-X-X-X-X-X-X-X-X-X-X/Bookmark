import {type listenFun, useWindowKeyEvent} from "@/util/useWindowKeyEvent";
import {useAppData} from "@/util/useAppData";

export const multipleSelectListener: () => listenFun = () => {
  // 确保上下文注入正确
  let {selectStatus, data} = useAppData();
  return (codes, type) => {
    if (!selectStatus()) return;
    if (type === 'keydown') {
      let {isMatchCodes} = useWindowKeyEvent();
      if (isMatchCodes(codes, [/^Control/, /KeyA/])) {
        data.selectNodes.length = 0;
        data.selectNodes.push(...data.bookmarkTree);
      }
      // 按下后会触发搜索...
      // if (isMatchCodes(codes, [/^Control/, /KeyC/])) {
      //   data.selectNodes.length = 0;
      // }
    }
  }
}