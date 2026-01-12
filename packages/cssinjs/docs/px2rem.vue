<script setup lang="ts">
/**
 * px2rem 转换器示例
 * 1:1 还原 React 版本 px2rem.tsx
 */
import { createTheme, px2remTransformer, StyleProvider, useStyleRegister } from '@vc-com/cssinjs';
</script>

<script lang="ts">
import { defineComponent, h } from 'vue';

const DemoBox = defineComponent({
  name: 'DemoBox',
  setup() {
    useStyleRegister({ theme: createTheme(() => ({})), token: {}, path: ['.px2rem-box'] }, () => ({
      '.px2rem-box': {
        width: '400px',
        backgroundColor: 'green',
        fontSize: '32px',
        border: '10PX solid #f0f',
        color: 'white',
      },
      '@media only screen and (max-width: 600px)': {
        '.px2rem-box': {
          backgroundColor: 'red',
        },
      },
    }));

    return () => h('div', { class: 'px2rem-box' }, 'px2rem');
  },
});
</script>

<template>
  <StyleProvider :transformers="[px2remTransformer()]">
    <DemoBox />
  </StyleProvider>
</template>
