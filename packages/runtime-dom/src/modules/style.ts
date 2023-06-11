import { isString } from '@myvue/shared'

export function patchStyle(el: Element, prev, next) {
  const style = (el as HTMLElement).style
  const isCss = isString(next)

  if (next && !isCss) {
    // 挂载新样式
    for (const key in next) {
      setStyle(style, key, next[key])
    }
    // 卸载旧样式
    if(prev && !isString(prev)){
      for(const key in prev) {
        if(next[key] === null){
          setStyle(style, key, '')
        }
      }
    }
  }
}

function setStyle(style: CSSStyleDeclaration, name: string, val: string) {
  style[name] = val
}
