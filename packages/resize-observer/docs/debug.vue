<script setup lang="ts">
/**
 * Debug Demo
 *
 * @description 展示多个子元素的警告情况
 */
import ResizeObserver from '@vc-com/resize-observer';
import { ref } from 'vue';
import './assets/index.less';

const times = ref(0);
const width = ref(0);
const height = ref(0);
const disabled = ref(false);

const onResize = (size: { width: number; height: number }) => {
  times.value++;
  width.value = size.width;
  height.value = size.height;
};
</script>

<template>
  <div>
    <div>
      <label>
        <input type="checkbox" :checked="disabled" @change="disabled = !disabled" />
        Disabled Observe
      </label>
      {{ ' >>> ' }}
      <span>Resize times: {{ times }} ({{ width }}/{{ height }})</span>
    </div>
    <ResizeObserver @resize="onResize" :disabled="disabled">
      <textarea placeholder="I'm a textarea!"></textarea>
      <button type="button">Warning with multiple children</button>
    </ResizeObserver>
  </div>
</template>
