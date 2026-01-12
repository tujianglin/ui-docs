<script setup lang="tsx">
/**
 * Render Props Demo
 *
 * @description 展示使用 render props 模式的 ResizeObserver
 */
import type { SizeInfo } from '@vc-com/resize-observer';
import ResizeObserver from '@vc-com/resize-observer';
import { h, ref, type Ref } from 'vue';
import './assets/index.less';

const times = ref(0);
const disabled = ref(false);

const onResize = (_size: SizeInfo) => {
  times.value++;
};

// Render props 函数
const renderTarget = (resizeRef: Ref<Element | undefined>) => {
  return h('div', { style: { display: 'inline-flex', flexDirection: 'column' } }, [
    h('textarea', { placeholder: "I'm a textarea!" }),
    h(
      'div',
      {
        ref: resizeRef,
        style: { background: 'red', height: '50px', fontSize: '10px' },
      },
      'Target',
    ),
  ]);
};
</script>

<template>
  <div :style="{ transform: 'scale(1.1)', transformOrigin: '0% 0%' }">
    <div>
      <label>
        <input type="checkbox" :checked="disabled" @change="disabled = !disabled" />
        Disabled Observe
      </label>
      {{ ' >>> ' }}
      <span>Resize times: {{ times }}</span>
    </div>
    <ResizeObserver @resize="onResize" :disabled="disabled">
      <component :is="() => renderTarget(ref())" />
    </ResizeObserver>
  </div>
</template>
