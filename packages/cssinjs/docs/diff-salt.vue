<script setup lang="ts">
/**
 * 不同 Salt 示例
 * 1:1 还原 React 版本 diff-salt.tsx
 */
import type { CSSInterpolation } from '@vc-com/cssinjs';
import { useStyleRegister } from '@vc-com/cssinjs';
import type { DerivativeToken } from './components/theme';
import { provideDesignTokenContext, useToken } from './components/theme';
</script>

<script lang="ts">
import { clsx } from 'clsx';
import { defineComponent, h } from 'vue';

// Style 1
const genStyle1 = (prefixCls: string, token: DerivativeToken): CSSInterpolation => [
  {
    [`.${prefixCls}`]: {
      width: 20,
      height: 20,
      backgroundColor: token.primaryColor,
      borderRadius: token.borderRadius,
    },
  },
];

// Style 2
const genStyle2 = (prefixCls: string, token: DerivativeToken): CSSInterpolation => [
  {
    [`.${prefixCls}`]: {
      width: 20,
      height: 20,
      backgroundColor: token.primaryColor,
      borderRadius: token.borderRadius * 3,
    },
  },
];

// Component
const genComponent = (genStyle: typeof genStyle1) => {
  return defineComponent({
    name: 'Box',
    props: {
      class: String,
    },
    setup(props, { attrs }) {
      const prefixCls = 'ant-box';

      // 【自定义】制造样式
      const [theme, token, hashId] = useToken();

      // 全局注册，内部会做缓存优化
      useStyleRegister({ theme: theme.value, token: token.value, hashId: hashId.value, path: [prefixCls] }, () => [
        genStyle(prefixCls, token.value),
      ]);

      return () => h('div', { class: clsx(prefixCls, hashId.value, props.class), ...attrs });
    },
  });
};

const Box1 = genComponent(genStyle1);
const Box2 = genComponent(genStyle2);

// Salt Provider
const SaltProvider = defineComponent({
  name: 'SaltProvider',
  props: {
    salt: String,
  },
  setup(props, { slots }) {
    provideDesignTokenContext({ hashed: props.salt });
    return () => slots.default?.();
  },
});
</script>

<template>
  <div
    :style="{
      background: 'rgba(0,0,0,0.1)',
      padding: '16px',
    }"
  >
    <h3>相同 Token 不同 Salt 互不冲突</h3>

    <div
      :style="{
        display: 'flex',
        columnGap: '8px',
      }"
    >
      <SaltProvider salt="123">
        <Box1 />
      </SaltProvider>
      <SaltProvider salt="234">
        <Box2 />
      </SaltProvider>
    </div>
  </div>
</template>
