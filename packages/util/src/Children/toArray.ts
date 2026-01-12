import type { VNode, VNodeArrayChildren, VNodeChild } from 'vue';
import { isVNode } from 'vue';
import { isFragment } from '../Vue/isFragment';

/**
 * 配置选项
 */
export interface Option {
  /** 是否保留空值 (null, undefined) */
  keepEmpty?: boolean;
}

/**
 * 将 Vue 的 VNode 子节点转换为扁平化的 VNode 数组
 *
 * @description
 * 该函数用于处理 Vue 组件的 slots 或 children，将嵌套的 VNode 结构
 * 展平为一维数组，同时会自动展开 Fragment 节点的子元素。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useSlots } from 'vue';
 * import toArray from '@/Children/toArray';
 *
 * const slots = useSlots();
 *
 * // 获取默认插槽的所有子节点
 * const children = toArray(slots.default?.());
 *
 * // 保留空值
 * const childrenWithEmpty = toArray(slots.default?.(), { keepEmpty: true });
 * </script>
 * ```
 *
 * @useCases 适用场景
 * 1. **遍历插槽内容** - 当需要对插槽中的每个子元素进行操作时
 * 2. **统计子元素数量** - 计算实际渲染的子元素个数
 * 3. **条件渲染** - 根据子元素内容决定是否渲染容器
 * 4. **克隆/修改子元素** - 在渲染前对子元素进行处理
 * 5. **展开 Fragment** - 将 `<template>` 或 Fragment 包裹的多个元素展平
 *
 * @param children - Vue 的 VNode 子节点，通常来自 slots.default?.()
 * @param option - 配置选项
 * @param option.keepEmpty - 是否保留 null/undefined 值，默认 false
 * @returns 扁平化后的 VNode 数组
 */
export default function toArray(children: VNodeChild | VNodeArrayChildren | undefined, option: Option = {}): VNode[] {
  let ret: VNode[] = [];

  // 处理 undefined 或 null
  if (children === undefined || children === null) {
    return option.keepEmpty ? (ret as VNode[]) : [];
  }

  // 遍历子节点
  const childList = Array.isArray(children) ? children : [children];

  for (const child of childList) {
    // 跳过空值（除非设置了 keepEmpty）
    if ((child === undefined || child === null) && !option.keepEmpty) {
      continue;
    }

    // 处理嵌套数组
    if (Array.isArray(child)) {
      ret = ret.concat(toArray(child, option));
    }
    // 处理 Fragment 节点，展开其子元素
    else if (isFragment(child) && isVNode(child)) {
      const fragmentChildren = child.children as VNodeArrayChildren;
      ret = ret.concat(toArray(fragmentChildren, option));
    }
    // 处理普通 VNode
    else if (isVNode(child)) {
      ret.push(child);
    }
  }

  return ret;
}
