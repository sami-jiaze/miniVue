import { isOn } from '@myvue/shared'
import { patchClass } from './modules/class'
import { patchDOMProp } from './modules/props'
import { patchAttr } from './modules/attrs'
import { patchStyle } from './modules/style'
import { patchEvent } from './modules/event'

export const patchProp = (el: Element, key, prevValue, nextValue) => {
  // console.log(el, key, prevValue, nextValue);

  if (key === 'class') {
    // console.log(el);
    patchClass(el, nextValue)
  } else if (key === 'style') {
    patchStyle(el, prevValue, nextValue)
  } else if (isOn(key)) {
    patchEvent(el, key, prevValue, nextValue)
  } else if (shouldSetAsProp(el, key)) {
    patchDOMProp(el, key, nextValue)
  } else {
    patchAttr(el, key, nextValue)
  }
}

// 属性是否应该作为 DOM Properties 被设置
function shouldSetAsProp(el: Element, key: string) {
  if (key === 'form') {
    return false
  }
  if (key === 'list' && el.nodeName === 'INPUT') {
    return false
  }
  if (key === 'type' && el.nodeName === 'TEXTAREA') {
    return false
  }
  return key in el
}
