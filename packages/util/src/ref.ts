import type { ComponentPublicInstance, Ref, VNode, VNodeChild } from 'vue';
import { isVNode } from 'vue';
import useMemo from './hooks/useMemo';
import { isFragment } from './Vue/isFragment';

/**
 * 填充 ref 值
 *
 * @description
 * 支持函数 ref 和对象 ref 两种形式。
 *
 * @example
 * ```ts
 * import { fillRef } from '@/ref';
 *
 * // 函数 ref
 * fillRef((el) => console.log(el), element);
 *
 * // 对象 ref
 * const myRef = ref(null);
 * fillRef(myRef, element);
 * ```
 */
export const fillRef = <T>(ref: Ref<T> | ((val: T) => void), node: T) => {
  if (typeof ref === 'function') {
    ref(node);
  } else if (typeof ref === 'object' && ref && 'value' in ref) {
    ref.value = node;
  }
};

/**
 * 合并多个 ref 为一个 ref 函数
 *
 * @description
 * 将多个 ref 合并为一个函数，调用时会同时填充所有 ref。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { composeRef } from '@/ref';
 * import { ref } from 'vue';
 *
 * const ref1 = ref(null);
 * const ref2 = ref(null);
 *
 * const composedRef = composeRef(ref1, ref2);
 * </script>
 *
 * <template>
 *   <div :ref="composedRef">Both refs will be filled</div>
 * </template>
 * ```
 *
 * @useCases 适用场景
 * 1. **多个 ref 绑定** - 需要同时绑定多个 ref 到同一元素
 * 2. **ref 转发** - 组件内部需要 ref，同时也要传递给父组件
 */
export const composeRef = <T>(...refs: (Ref<T> | ((val: T) => void))[]): ((val: T) => void) => {
  const refList = refs.filter(Boolean);
  if (refList.length <= 1) {
    return refList[0] as (val: T) => void;
  }
  return (node: T) => {
    refs.forEach((ref) => {
      fillRef(ref, node);
    });
  };
};

/**
 * 带缓存的 composeRef
 *
 * @description
 * 使用 useMemo 缓存 composeRef 的结果，避免不必要的重新创建。
 */
export const useComposeRef = <T>(...refs: (Ref<T> | ((val: T) => void))[]): ((val: T) => void) => {
  return useMemo(
    () => composeRef(...refs),
    refs,
    (prev, next) => prev.length !== next.length || prev.every((ref, i) => ref !== next[i]),
  );
};

/**
 * 判断 VNode 是否支持 ref
 *
 * @description
 * 检查一个 VNode 或组件是否可以接收 ref。
 *
 * @param nodeOrComponent - VNode 或组件
 * @returns 是否支持 ref
 */
export const supportRef = (nodeOrComponent: any): boolean => {
  if (!nodeOrComponent) {
    return false;
  }

  // Vue 组件都支持 ref
  if (isVNode(nodeOrComponent)) {
    return true;
  }

  // 组件对象
  if (typeof nodeOrComponent === 'object' && nodeOrComponent !== null) {
    return true;
  }

  return false;
};

/**
 * 判断是否是有效的 Vue 元素
 */
function isVueElement(node: VNodeChild): node is VNode {
  return isVNode(node) && !isFragment(node);
}

/**
 * 判断 VNode 是否支持 ref
 */
export const supportNodeRef = (node: VNodeChild): node is VNode => {
  return isVueElement(node) && supportRef(node);
};

/**
 * 获取 VNode 的 ref
 *
 * @description
 * 从 VNode 中提取 ref 属性。
 *
 * @param node - VNode
 * @returns ref 或 null
 */
export const getNodeRef: <T = ComponentPublicInstance>(node: VNodeChild) => Ref<T> | null = (node) => {
  if (node && isVueElement(node)) {
    return (node as any).ref ?? null;
  }
  return null;
};
