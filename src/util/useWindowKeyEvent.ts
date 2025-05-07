export type listenFun = ((codes: string[], type: "keyup" | "keydown", originEvent: KeyboardEvent) => void);
const pressKeys: string[] = [];
let clearTimer: number;
let observeFun: listenFun[] = [];

export const registerWindowKeyEvent = () => {
  window.addEventListener("keyup", (e) => {
    observeFun.forEach(v => v(pressKeys, 'keyup', e));
    let idx = pressKeys.indexOf(e.code)
    if (idx === -1) return;
    pressKeys.splice(idx, 1)
  })
  window.addEventListener("keydown", (e) => {
    clearTimeout(clearTimer);
    if (pressKeys.includes(e.code)) return;
    pressKeys.push(e.code);
    observeFun.forEach(v => v(pressKeys, 'keydown', e));
    clearTimer = setTimeout(() => pressKeys.length = 0, 2000)
  })
}

export const useWindowKeyEvent = () => {
  return {
    addListener(f: listenFun) {
      if (observeFun.includes(f)) return;
      observeFun.push(f);
    },
    removeListener(f: listenFun) {
      let idx = observeFun.indexOf(f);
      if (idx === -1) return;
      observeFun.splice(idx, 1)
    },
    isMatchCodes(codes: string[], match: RegExp[]) {
      return codes.length === match.length && match.every((v, i) => v.test(codes[i]));
    }
  }
}