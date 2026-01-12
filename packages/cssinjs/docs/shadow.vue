<script setup lang="ts">
/**
 * Shadow DOM 示例
 * 1:1 还原 React 版本 shadow.tsx
 */
import { createCache, StyleProvider } from '@vc-com/cssinjs';
import { computed, createApp, h, onMounted, onUnmounted, ref, watch } from 'vue';
import Button from './components/Button';
import Spin from './components/Spin';
import { DesignTokenContextKey, provideDesignTokenContext } from './components/theme';

const visible = ref(true);
const pRef = ref<HTMLParagraphElement | null>(null);

let cleanup: (() => void) | null = null;

const mountShadowApp = () => {
  if (!pRef.value || !visible.value) return;

  const rootElement = document.createElement('div');
  pRef.value.parentElement?.appendChild(rootElement);

  const shadowRoot = rootElement.attachShadow({ mode: 'open' });
  const container = document.createElement('div');
  container.id = 'vueRoot';
  shadowRoot.appendChild(container);

  const app = createApp({
    setup() {
      return () =>
        h(StyleProvider, { container: shadowRoot, cache: createCache() }, () =>
          h('div', { style: { border: '6px solid #000', padding: '8px' } }, [
            h('h1', null, 'Shadow Root!'),
            h(Button, { type: 'primary' }, () => 'Hello World!'),
            h(Spin),
          ]),
        );
    },
  });

  app.provide(
    DesignTokenContextKey,
    computed(() => ({ hashed: true })),
  );
  app.mount(container);

  cleanup = () => {
    app.unmount();
    rootElement.remove();
  };
};

watch(visible, (val) => {
  if (val) {
    // 延迟挂载确保 DOM 已更新
    setTimeout(mountShadowApp, 0);
  } else {
    cleanup?.();
    cleanup = null;
  }
});

onMounted(() => {
  if (visible.value) {
    mountShadowApp();
  }
});

onUnmounted(() => {
  cleanup?.();
});

// 提供默认 hashed 上下文
provideDesignTokenContext({ hashed: true });
</script>

<template>
  <div>
    <button @click="visible = !visible">Trigger {{ visible }}</button>
    <p ref="pRef"></p>
  </div>
</template>
