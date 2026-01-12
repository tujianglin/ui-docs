<script setup lang="ts">
/**
 * Keyframes 动画示例
 * 1:1 还原 React 版本 animation.tsx
 */
import Spin from './components/Spin';
import { provideDesignTokenContext } from './components/theme';

// 提供 hashed 上下文
provideDesignTokenContext({ hashed: true });
</script>

<script lang="ts">
import { defineComponent } from 'vue';

const orangeTheme = {
  primaryColor: 'orange',
};

// Orange 主题 Provider
const OrangeThemeProvider = defineComponent({
  name: 'OrangeThemeProvider',
  setup(_, { slots }) {
    provideDesignTokenContext({ token: orangeTheme, hashed: true });
    return () => slots.default?.();
  },
});
</script>

<template>
  <div :style="{ background: 'rgba(0,0,0,0.1)', padding: '16px' }">
    <Spin />

    <OrangeThemeProvider>
      <Spin />
    </OrangeThemeProvider>
  </div>
</template>
