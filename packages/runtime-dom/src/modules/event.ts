export function patchEvent(
  el: Element & { _vei?: Object },
  rawName: string,
  prevValue,
  nextValue,
) {
  // 在绑定事件时，我们可以绑定一个伪造的事件处理
  // 函数 invoker，然后把真正的事件处理函数设置为 invoker.value
  // 属性的值。这样当更新事件的时候，我们将不再需要调用
  // removeEventListener 函数来移除上一次绑定的事件，只需要更新
  // invoker.value 的值即可
  const invokers = el._vei || (el._vei = {})
  // 是否存在缓存事件
  const existingInvoker = invokers[rawName]
  // 存在缓存，并且存在新的事件行为，更新 invoker 的 value
  if (nextValue && existingInvoker) {
    existingInvoker.value = nextValue
  } else {
    // 如果没有 invoker，则将一个伪造的 invoker 缓存到 el._vei 中
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

// 根据属性名称得到对应的事件名称，例如 onClick ---> click
function parseName(name: string) {
  return name.slice(2).toLowerCase()
}

function createInvoker(initialValue) {
  const invoker = (e: Event) => {
    // 有value就触发 当伪造的事件处理函数执行时，会执行真正的事件处理函数
    invoker.value && invoker.value()
  }
  // value 为真实的事件行为
  invoker.value = initialValue
  // console.log('invoker', invoker)

  return invoker
}
