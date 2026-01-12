<script setup lang="tsx">
import Basic from './basic';
import './basic.less';
import GetContainer from './getContainer';
import InlineOrder from './inlineOrder';
</script>

<template>
  <Story title="Portal" group-order="1" order="1" cols="2">
    <Variant title="基础用法">
      <Basic />
    </Variant>

    <Variant title="自定义容器">
      <GetContainer />
    </Variant>

    <Variant title="嵌套顺序">
      <InlineOrder />
    </Variant>
  </Story>
</template>

<docs lang="md">
# Portal 传送门

将子组件渲染到指定的 DOM 节点。基于 Vue 3 Teleport 实现。

## Props

| 属性名         | 类型                                            | 默认值      | 说明                          |
| -------------- | ----------------------------------------------- | ----------- | ----------------------------- |
| `open`         | `boolean`                                       | `false`     | 是否显示 Portal 内容          |
| `getContainer` | `string \| Element \| (() => Element) \| false` | `undefined` | 指定渲染容器，默认渲染到 body |
| `autoDestroy`  | `boolean`                                       | `true`      | 关闭时是否自动销毁子组件      |
| `autoLock`     | `boolean`                                       | `false`     | 打开时是否锁定页面滚动        |
| `onEsc`        | `({ top, event }) => void`                      | `undefined` | ESC 键按下时的回调            |

---

## 特性

- ✅ 支持嵌套 Portal，保证正确渲染顺序
- ✅ 支持 ESC 键关闭（多层 Portal 只响应最顶层）
- ✅ 支持滚动锁定，防止背景滚动
- ✅ SSR 友好，仅在客户端渲染
</docs>
