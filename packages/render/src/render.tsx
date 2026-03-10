import { isBoolean } from 'es-toolkit';
import { isArray } from 'es-toolkit/compat';
import { cloneVNode, defineComponent, getCurrentInstance, h, isVNode, useAttrs, type Component } from 'vue';
function isComponent(value: unknown): boolean {
  // 检查值不为null，且类型为对象或函数，并且不是虚拟节点
  return value !== null && (typeof value === 'object' || typeof value === 'function') && !isVNode(value);
}

export default defineComponent(({ content }: { content: any }) => {
  const vm = getCurrentInstance();
  const attrs = useAttrs();
  const slots = defineSlots();
  defineExpose({
    get nativeElement() {
      return vm.exposed;
    },
  });
  return () => {
    if (isBoolean(content)) {
      return null;
    }
    if (isComponent(content) && !isArray(content)) {
      return h(content as Component, { ...attrs }, slots);
    }
    if (isVNode(content)) {
      return cloneVNode(content, { ...attrs });
    }
    return content as any;
  };
});
