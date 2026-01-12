<script setup lang="tsx">
/**
 * Collection 用法 Demo
 *
 * @description 展示 ResizeObserver.Collection 批量收集 resize 事件
 */
import ResizeObserver from '@vc-com/resize-observer';
import type { ResizeInfo } from '@vc-com/resize-observer/Collection';
import { effect, ref } from 'vue';
import './assets/index.less';

function randomSize() {
  return {
    width: `${Math.round(50 + Math.random() * 150)}px`,
    height: `${Math.round(50 + Math.random() * 150)}px`,
  };
}

const sharedStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
};

const size1 = ref(randomSize());
const size2 = ref(randomSize());

console.log('Render:', size1.value, size2.value);

const onBatchResize = (infoList: ResizeInfo[]) => {
  console.log(
    'Batch Resize:',
    infoList,
    infoList.map(({ data, size }) => `${data}(${size.width}/${size.height})`),
  );
};
effect(() => {
  console.log(size1.value.width);
});
</script>

<template>
  <ResizeObserver.Collection @batch-resize="onBatchResize">
    <div :style="{ display: 'flex', columnGap: '4px', marginBottom: '8px' }">
      <button @click="size1 = randomSize()">Resize: 1</button>
      <button @click="size2 = randomSize()">Resize: 2</button>
      <button
        @click="
          () => {
            size1 = randomSize();
            size2 = randomSize();
          }
        "
      >
        Resize: all
      </button>
    </div>
    <div :style="{ display: 'flex', columnGap: '16px' }">
      <ResizeObserver data="shape_1">
        <div :style="[{ ...sharedStyle, background: 'red' }, size1]">1</div>
      </ResizeObserver>
      <ResizeObserver data="shape_2">
        <div :style="[{ ...sharedStyle, background: 'blue' }, size2]">2</div>
      </ResizeObserver>
    </div>
  </ResizeObserver.Collection>
</template>
