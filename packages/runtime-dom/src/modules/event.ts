export function patchEvent(
  el: Element & { _vei?: Object },
  rawName: string,
  prevValue,
  nextValue,
) {
  const invokers = el._vei || (el._vei = {})
  // 是否存在缓存事件
  const existingInvoker = invokers[rawName]
  // 存在缓存，并且存在新的事件行为，更新 invoker 的 value
  if (nextValue && existingInvoker) {
    existingInvoker.value = nextValue
  } else {
    // 获取事件名
    const name = parseName(rawName)
    if (nextValue) {
      const invoker = (invokers[rawName] = createInvoker(nextValue))
      // console.log("invoker", invoker);
      el.addEventListener(name, invoker)
    } else if (existingInvoker) {
      el.removeEventListener(name, existingInvoker)
      invokers[rawName] = undefined
    }
  }
}

function parseName(name: string) {
  return name.slice(2).toLowerCase()
}

function createInvoker(initialValue) {
  const invoker = (e: Event) => {
    // 有value就触发
    invoker.value && invoker.value()
  }
  // value 为真实的事件行为
  invoker.value = initialValue
  // console.log('invoker', invoker)

  return invoker
}
