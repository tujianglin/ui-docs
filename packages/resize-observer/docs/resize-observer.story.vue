<script setup lang="tsx">
import BasicDemo from './basic.vue';
import CollectionDemo from './collection.vue';
import DebugDemo from './debug.vue';
import RenderPropsDemo from './renderProps.vue';
</script>

<template>
  <Story title="ResizeObserver" cols="2">
    <Variant title="基础用法">
      <BasicDemo />
    </Variant>

    <Variant title="Collection 批量收集">
      <CollectionDemo />
    </Variant>

    <Variant title="多子元素警告">
      <DebugDemo />
    </Variant>

    <Variant title="Render Props">
      <RenderPropsDemo />
    </Variant>
  </Story>
</template>

<docs lang="md">
# ResizeObserver

Vue 3 ResizeObserver 组件，用于监听子元素尺寸变化。

## 安装

```bash
pnpm add @a-v/resize-observer
```

## 基础用法

```vue
<script setup>
import ResizeObserver from '@a-v/resize-observer';

const onResize = (size) => {
  console.log('Size changed:', size);
};
</script>

<template>
  <ResizeObserver :onResize="onResize">
    <div>监听我的尺寸变化</div>
  </ResizeObserver>
</template>
```

## Props

| 属性名   | 类型                                           | 默认值 | 说明                         |
| -------- | ---------------------------------------------- | ------ | ---------------------------- |
| disabled | boolean                                        | false  | 禁用观察                     |
| data     | any                                            | -      | 传递给 Collection 的附加数据 |
| onResize | (size: SizeInfo, element: HTMLElement) => void | -      | 尺寸变化回调                 |

## Events

| 事件名 | 参数                                   | 说明           |
| ------ | -------------------------------------- | -------------- |
| resize | (size: SizeInfo, element: HTMLElement) | 尺寸变化时触发 |

## SizeInfo 类型

```ts
interface SizeInfo {
  width: number;
  height: number;
  offsetWidth: number;
  offsetHeight: number;
}
```

## Collection 组件

用于批量收集多个 ResizeObserver 的 resize 事件：

```vue
<script setup>
import { ResizeObserver, Collection } from '@a-v/resize-observer';

const onBatchResize = (infoList) => {
  console.log('Batch resize:', infoList);
};
</script>

<template>
  <Collection :onBatchResize="onBatchResize">
    <ResizeObserver data="box1">
      <div>Box 1</div>
    </ResizeObserver>
    <ResizeObserver data="box2">
      <div>Box 2</div>
    </ResizeObserver>
  </Collection>
</template>
```
</docs>
