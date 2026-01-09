<script setup lang="ts">
import { Input } from '@vc-com/portal';
import { ref } from 'vue';

const basicVal = ref('Hello Vapor!');
const customVal = ref('Portal Target');
const complexVal = ref('Nested Scenarios');
</script>

<template>
  <Story title="Portal 传送门" icon="lucide:layers" :cols="2">
    <Variant title="基础用法" description="最简单的传送门用法，直接将元素渲染到 Body 底部。">
      <div class="flex items-center space-x-4 rounded-xl border border-gray-100 bg-gray-50 p-6">
        <div class="flex-1">
          <Input v-model:value="basicVal" placeholder="输入内容..." />
        </div>
        <button
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
        >
          点击测试
        </button>
      </div>
    </Variant>

    <Variant title="自定义容器" description="通过 get-container 属性指定渲染的目标 DOM 节点。">
      <div class="space-y-6">
        <div
          class="flex min-h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-100 bg-blue-50/20 p-8"
        >
          <div class="mb-2 text-[10px] font-black tracking-widest text-blue-300 uppercase">Target Area #portal-root</div>
          <div id="portal-root" class="w-full"></div>
        </div>

        <div class="flex items-center space-x-3">
          <Input v-model:value="customVal" placeholder="将发送到上方虚线框..." class="flex-1" />
          <div class="font-mono text-xs text-gray-400 italic">target="#portal-root"</div>
        </div>
      </div>
    </Variant>

    <Variant title="交互反馈" description="结合状态管理实现复杂的交互式传送门。">
      <div class="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-10 shadow-xl shadow-gray-100/50">
        <div class="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <svg
            viewBox="0 0 24 24"
            width="32"
            height="32"
            class="text-blue-500"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <h5 class="mb-2 text-sm font-bold text-gray-900">Ready to Transmit</h5>
        <p class="mb-6 text-center text-[12px] text-gray-400">
          Configure your portal parameters below before initiating the transfer.
        </p>

        <div class="w-full max-w-xs space-y-4">
          <Input v-model:value="complexVal" placeholder="Packet Data..." />
          <button class="w-full rounded-xl bg-gray-900 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-600">
            EXECUTE PORTAL
          </button>
        </div>
      </div>
    </Variant>
  </Story>
</template>

<docs lang="md">
# Portal 传送门

`Portal` 组件提供了一种将子节点渲染到父组件 DOM 层次结构之外的 DOM 节点的方法。

## 何时使用

- 需要在 `overflow: hidden` 或 `z-index` 受限的容器中显示溢出内容（如：Modal, Tooltip）。
- 需要在同一个位置渲染来自不同组件的片段。

## 代码示例

```vue
<template>
  <Portal :target="myTarget">
    <div class="content">...</div>
  </Portal>
</template>
```
</docs>
