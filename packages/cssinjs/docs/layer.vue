<script setup lang="ts">
/**
 * CSS @layer 示例
 * 1:1 还原 React 版本 layer.tsx
 */
import type { CSSInterpolation } from '@vc-com/cssinjs';
import { StyleProvider, Theme, useStyleRegister } from '@vc-com/cssinjs';
</script>

<script lang="ts">
import { clsx } from 'clsx';
import { defineComponent, h } from 'vue';

const theme = new Theme([() => ({})]);

// Layer Div 组件
const LayerDiv = defineComponent({
  name: 'LayerDiv',
  props: {
    class: String,
  },
  setup(props, { slots, attrs }) {
    // Layer
    useStyleRegister(
      {
        theme,
        token: { _tokenKey: 'test' },
        path: ['layer'],
        layer: {
          name: 'layer',
          dependencies: ['shared'],
        },
      },
      () =>
        ({
          '.layer-div': {
            color: 'blue',

            a: {
              color: 'pink',
              cursor: 'pointer',

              '&:hover': {
                color: 'red',
              },
            },
          },
        }) as CSSInterpolation,
    );

    // Shared
    useStyleRegister(
      {
        theme,
        token: { _tokenKey: 'test' },
        path: ['shared'],
        layer: {
          name: 'shared',
        },
      },
      () =>
        ({
          'html body .layer-div': {
            color: 'green',
          },
        }) as CSSInterpolation,
    );

    return () => h('div', { class: clsx(props.class, 'layer-div'), ...attrs }, slots.default?.());
  },
});
</script>

<template>
  <StyleProvider :layer="true">
    <LayerDiv>
      Text should be blue.
      <div>The link should be <a>pink</a></div>
    </LayerDiv>
  </StyleProvider>
</template>
