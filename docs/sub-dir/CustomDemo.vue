<script setup lang="ts">
import { Input } from '@vc-com/portal';
import { ref } from 'vue';

const text = ref('这是来自深层目录的组件源码！');
</script>

<template>
  <div class="w-full max-w-md rounded-2xl border border-purple-100 bg-purple-50 p-8">
    <div class="mb-4 text-xs font-bold tracking-widest text-purple-400 uppercase">Nested Component</div>
    <Input v-model:value="text" placeholder="测试源码提取..." />
    <p class="mt-4 line-clamp-1 text-[13px] text-purple-600/70 italic">Path: docs/sub-dir/CustomDemo.vue</p>
  </div>
</template>
