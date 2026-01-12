<script setup lang="ts">
/**
 * Logical Properties 示例
 * 1:1 还原 React 版本 logicalProperties.tsx
 */
import { createTheme, legacyLogicalPropertiesTransformer, StyleProvider, useStyleRegister } from '@vc-com/cssinjs';
</script>

<script lang="ts">
import { defineComponent, h } from 'vue';

const DemoBox = defineComponent({
  name: 'DemoBox',
  setup() {
    useStyleRegister(
      {
        theme: createTheme(() => ({})),
        token: {},
        path: ['.logical-properties-box'],
      },
      () => ({
        '.logical-properties-box': {
          width: '300px',
          height: 100,
          backgroundColor: 'pink',
          border: '1px solid #000',
          position: 'relative',
          // css logical-properties
          paddingInline: 10,
          borderBlockEndWidth: 3,
          marginBlock: 10,
          borderEndEndRadius: '50%',
          inset: 5,
        },
      }),
    );

    return () => h('div', { class: 'logical-properties-box' }, 'logicalProperties');
  },
});
</script>

<template>
  <StyleProvider :transformers="[legacyLogicalPropertiesTransformer]">
    <DemoBox />
  </StyleProvider>
</template>
