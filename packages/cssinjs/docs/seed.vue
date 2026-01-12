<script setup lang="ts">
/**
 * 混合 SeedToken 示例
 * 1:1 还原 React 版本 seed.tsx
 */
import { defineComponent, h } from 'vue';
import Button from './components/Button';
import type { DesignToken } from './components/theme';
import { provideDesignTokenContext } from './components/theme';

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

// Token Provider
const TokenProvider = defineComponent({
  name: 'TokenProvider',
  props: {
    token: Object as () => Partial<DesignToken>,
    hashed: [Boolean, String],
  },
  setup(props, { slots }) {
    provideDesignTokenContext({ token: props.token, hashed: props.hashed ?? true });
    return () => slots.default?.();
  },
});

const redTheme: Partial<DesignToken> = {
  primaryColor: 'red',
};

const orangeTheme: Partial<DesignToken> = {
  primaryColor: 'orange',
};
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', rowGap: '8px' }">
    <h3>混合 SeedToken</h3>

    <ButtonList />

    <TokenProvider :token="redTheme" :hashed="true">
      <ButtonList />
    </TokenProvider>

    <TokenProvider :token="orangeTheme" :hashed="true">
      <ButtonList />
    </TokenProvider>
  </div>
</template>
