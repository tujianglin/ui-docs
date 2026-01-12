<script setup lang="ts">
/**
 * CSS-in-JS 基础用法示例
 * 1:1 还原 React 版本 basic.tsx
 */
import { ref } from 'vue';
import Button from './components/Button';

const show = ref(true);
</script>

<template>
  <div :style="{ background: 'rgba(0,0,0,0.1)', padding: '16px' }">
    <h3>默认情况下不会自动删除添加的样式</h3>

    <label>
      <input v-model="show" type="checkbox" />
      Show Components
    </label>

    <template v-if="show">
      <Button>Default</Button>
      <Button type="primary">Primary</Button>
      <Button type="ghost">Ghost</Button>

      <Button class="btn-override">Override By ClassName</Button>
    </template>
  </div>
</template>

<style>
.btn-override {
  background: rgb(255, 200, 200);
}
</style>
