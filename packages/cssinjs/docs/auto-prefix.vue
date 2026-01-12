<script setup lang="ts">
/**
 * Auto Prefix 示例
 * 1:1 还原 React 版本 autoPrefix.tsx
 */
import { autoPrefixTransformer, createTheme, StyleProvider, useStyleRegister } from '../src';
</script>

<script lang="ts">
import { defineComponent, h } from 'vue';

const DemoBox = defineComponent({
  name: 'DemoBox',
  setup() {
    useStyleRegister({ theme: createTheme(() => ({})), token: {}, path: ['.auto-prefix-box'] }, () => ({
      '.auto-prefix-box': {
        width: '200px',
        height: '200px',
        backgroundColor: '#f0f0f0',
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        // Properties that will get vendor prefixes
        transform: 'translateX(50px) scale(1.1)',
        transition: 'all 0.3s ease',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)',
        '&:hover': {
          transform: 'translateX(50px) scale(1.2)',
          backgroundColor: '#e6f7ff',
        },
      },
    }));

    return () =>
      h('div', { class: 'auto-prefix-box' }, [
        h('h3', null, 'Auto Prefix Demo'),
        h('p', null, 'Hover to see effect'),
        h('p', { style: { fontSize: '12px', color: '#666' } }, 'Check DevTools to see vendor prefixes in CSS'),
      ]);
  },
});
</script>

<template>
  <StyleProvider :transformers="[autoPrefixTransformer]">
    <DemoBox />
  </StyleProvider>
</template>
