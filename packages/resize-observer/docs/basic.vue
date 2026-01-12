<script setup lang="tsx">
/**
 * 基础用法 Demo
 *
 * @description 展示 ResizeObserver 的基本用法
 */
import type { SizeInfo } from '@vc-com/resize-observer';
import ResizeObserver from '@vc-com/resize-observer';
import { onMounted, ref } from 'vue';
import './assets/index.less';

const Wrapper = (_props: any, { slots }: any) => slots?.default?.();

const times = ref(0);
const disabled = ref(false);
const textareaRef = ref<HTMLTextAreaElement>();

onMounted(() => {
  console.log('Ref:', textareaRef.value);
});

const onResize = ({ width, height, offsetHeight, offsetWidth }: SizeInfo) => {
  times.value++;
  console.log('Resize:', '\n', 'BoundingBox', width, height, '\n', 'Offset', offsetWidth, offsetHeight);
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
      <Wrapper>
        <textarea ref="textareaRef" placeholder="I'm a textarea!"></textarea>
      </Wrapper>
    </ResizeObserver>
  </div>
</template>
