<script setup lang="ts">
/**
 * 首次渲染性能测试
 * 1:1 还原 React 版本 first-render.tsx
 */
import { ref } from 'vue';
import Button from './components/Button';

const show = ref(false);
</script>

<script lang="ts">
import { defineComponent, h, onMounted, ref as vueRef } from 'vue';

const Demo = defineComponent({
  name: 'Demo',
  setup() {
    const renderStart = vueRef(Date.now());
    const renderTime = vueRef(0);

    onMounted(() => {
      renderTime.value = Date.now() - renderStart.value;
    });

    return () =>
      h('div', null, [
        h('p', null, `Render Time: ${renderTime.value}ms`),
        ...Array(10000)
          .fill(1)
          .map((_, key) =>
            h('div', { key }, [
              h(Button, null, () => 'Default'),
              h(Button, { type: 'primary' }, () => 'Primary'),
              h(Button, { type: 'ghost' }, () => 'Ghost'),
              h(Button, { class: 'btn-override' }, () => 'Override By ClassName'),
            ]),
          ),
      ]);
  },
});
</script>

<template>
  <div :style="{ background: 'rgba(0,0,0,0.1)', padding: '16px' }">
    <h3>默认情况下不会自动删除添加的样式</h3>

    <label>
      <input v-model="show" type="checkbox" />
      Show Components
    </label>

    <div v-if="show">
      <Demo />
    </div>
  </div>
</template>

<style>
.btn-override {
  background: rgb(255, 200, 200);
}
</style>
