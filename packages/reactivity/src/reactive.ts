import { mutableHandlers } from "./baseHandlers"

// 代理缓存的map
export const reactiveMap = new WeakMap<object, any>();

// 主函数 target为被代理对象
export function myReactive(target: object) {
  return createReactiveObject(target, mutableHandlers, reactiveMap)
}

function createReactiveObject(
  target: object,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<object, any>,
) {
  const exisitProxy = proxyMap.get(target);
  if (exisitProxy) return exisitProxy
  
  const targetProxy = new Proxy(target, baseHandlers)

  // 缓存代理对象
  proxyMap.set(target, targetProxy);

  return targetProxy;
}
