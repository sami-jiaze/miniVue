// 是否为数组
export const isArray = Array.isArray

// 是否为对象
export const isObject = (val:unknown) => {
  return val !== null && typeof val === 'object'
}

// 值是否发送改变
export const hasChanged = (newVal: any, oldVal: any):boolean => {
  return !Object.is(newVal, oldVal);
}