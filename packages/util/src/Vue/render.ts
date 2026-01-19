import type { Component, VNode } from 'vue';
import { createApp, h, type App } from 'vue';

const MARK = '__vue_render_root__';

// ========================== Render ==========================
type ContainerType = Element & {
  [MARK]?: App;
};

/**
 * Vue 版本的 render 函数
 *
 * @description
 * 将 Vue 组件或 VNode 渲染到指定容器中。
 * 支持同一容器多次 render，会自动卸载之前的实例。
 *
 * @example
 * ```ts
 * import { render, unmount } from '@/Vue/render';
 * import MyComponent from './MyComponent.vue';
 *
 * const container = document.getElementById('app');
 *
 * // 渲染组件
 * render(MyComponent, container, { message: 'Hello' });
 *
 * // 渲染 VNode
 * render(h('div', 'Hello World'), container);
 *
 * // 卸载
 * await unmount(container);
 * ```
 *
 * @useCases 适用场景
 * 1. **命令式组件** - Dialog.confirm() 等命令式 API
 * 2. **动态渲染** - 根据条件动态挂载组件
 * 3. **Portal 渲染** - 渲染到 body 或其他容器
 *
 * @param node - Vue 组件或 VNode
 * @param container - 目标容器
 * @param props - 传递给组件的 props（可选）
 */
export function render(node: Component | VNode, container: ContainerType, props?: Record<string, unknown>) {
  // 如果已有实例，先卸载
  if (container[MARK]) {
    container[MARK].unmount();
  }

  // 创建新的 Vue 应用实例
  const app = createApp({
    render() {
      // 如果是 VNode 直接返回
      if (typeof node === 'object' && 'type' in node) {
        return node;
      }
      // 否则创建 VNode
      return h(node as Component, props);
    },
  });

  app.mount(container);
  container[MARK] = app;
}

// ========================= Unmount ==========================
/**
 * 卸载容器中的 Vue 实例
 *
 * @param container - 目标容器
 */
export async function unmount(container: ContainerType) {
  // 延迟卸载以避免同步警告
  return Promise.resolve().then(() => {
    container[MARK]?.unmount();
    delete container[MARK];
  });
}
