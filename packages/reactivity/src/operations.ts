// 因为什么收集
export const enum TrackOpTypes {
  GET = 'get',
  // 如 a in observed
  HAS = 'has',
  // 如 Object.keys(observed)
  ITERATE = 'iterate',
}

// 因为什么重新触发
export const enum TriggerOpTypes {
  SET = 'set',
  ADD = 'add',
  DELETE = 'delete',
  // 在集合时使用 如map.clear()
  CLEAR = 'clear',
}
