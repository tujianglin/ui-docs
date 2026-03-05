import { isArray, isBoolean } from 'es-toolkit/compat';
import { cloneVNode, defineComponent, getCurrentInstance, h, isVNode, type Component } from 'vue';
function isComponent(value: unknown): boolean {
  // 检查值不为null，且类型为对象或函数，并且不是虚拟节点
  return value !== null && (typeof value === 'object' || typeof value === 'function') && !isVNode(value);
}
export default defineComponent({
  inheritAttrs: false,
  name: 'Render',
  props: {
    content: {
      type: [Object, Boolean, String, Number, Function],
      default: undefined,
    },
  },
  setup(props, { attrs, slots, expose }) {
    const vm = getCurrentInstance();
    expose({
      get el() {
        return vm.exposed;
      },
    });
    return () => {
      if (isBoolean(props.content)) {
        return null;
      }
      if (isComponent(props.content) && !isArray(props.content)) {
        return h(props.content as Component, { ...attrs }, slots);
      }
      if (isVNode(props.content)) {
        return cloneVNode(props.content, { ...attrs });
      }
      return <>{props.content}</>;
    };
  },
});
