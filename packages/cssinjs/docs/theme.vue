<script setup lang="ts">
/**
 * 混合主题示例
 * 1:1 还原 React 版本 theme.tsx
 */
import { createTheme } from '@vc-com/cssinjs';
import { defineComponent, h, ref } from 'vue';
import Button from './components/Button';
import type { DerivativeToken, DesignToken } from './components/theme';
import { provideDesignTokenContext, provideThemeContext } from './components/theme';

function derivativeA(designToken: DesignToken): DerivativeToken {
  return {
    ...designToken,
    primaryColor: 'red',
    primaryColorDisabled: 'red',
  };
}

function derivativeB(designToken: DesignToken): DerivativeToken {
  return {
    ...designToken,
    primaryColor: 'green',
    primaryColorDisabled: 'green',
  };
}

const forceUpdateKey = ref(0);

// 提供默认 hashed 上下文
provideDesignTokenContext({ hashed: true });

// 按钮列表组件
const ButtonList = defineComponent({
  name: 'ButtonList',
  setup() {
    return () =>
      h('div', { style: { background: 'rgba(0,0,0,0.1)', padding: '16px' } }, [
        h(Button, null, () => 'Default'),
        h(Button, { type: 'primary' }, () => 'Primary'),
        h(Button, { type: 'ghost' }, () => 'Ghost'),
      ]);
  },
});

// 红色主题 Provider
const ThemeProviderA = defineComponent({
  name: 'ThemeProviderA',
  setup(_, { slots }) {
    provideThemeContext(createTheme(derivativeA));
    return () => slots.default?.();
  },
});

// 绿色主题 Provider
const ThemeProviderB = defineComponent({
  name: 'ThemeProviderB',
  setup(_, { slots }) {
    provideThemeContext(createTheme(derivativeB));
    return () => slots.default?.();
  },
});
</script>

<template>
  <div :key="forceUpdateKey" :style="{ display: 'flex', flexDirection: 'column', rowGap: '8px' }">
    <h3>混合主题</h3>

    <ButtonList />

    <ThemeProviderA>
      <ButtonList />
    </ThemeProviderA>

    <ThemeProviderB>
      <ButtonList />
    </ThemeProviderB>

    <button @click="forceUpdateKey++">Force ReRender</button>
  </div>
</template>
