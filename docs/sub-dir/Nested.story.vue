<script setup lang="ts">
import Demo from './CustomDemo.vue';
</script>

<template>
  <Story title="自定义演示 (嵌套目录)">
    <Variant title="深层目录测试" description="测试从 docs/sub-dir/ 目录下读取故事。">
      <Demo />
    </Variant>
  </Story>
</template>

<docs lang="md">
# 嵌套目录测试

这是一个位于 `docs/sub-dir/` 下的示例，用于演示全局扫描和深度源码提取。

## 核心特性

- **递归扫描**：侧边栏自动发现所有子目录中的 `*.story.vue`。
- **路径解析**：即便在深层目录，代码预览也能正确指向同级的 `CustomDemo.vue`。
</docs>
