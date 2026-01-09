<script setup lang="ts">
import Demo from './index.vue';
</script>

<template>
  <Story title="Portal 传送门">
    <Variant title="基础用法">
      <Demo />
    </Variant>
  </Story>
</template>

<docs lang="md">
# Basic Usage

This is a basic example of the `Portal` component.

## When to use

Use this component when you need a simple input field with Vapor support.

## Code Example

```tsx
import { Input } from '@vc-com/portal';

<Input v-model:value={val} />;
```

## Props

| Property    | Description       | Type     | Default |
| ----------- | ----------------- | -------- | ------- |
| value       | Input value       | `string` | -       |
| placeholder | Input placeholder | `string` | -       |
| description | Input description | `string` | -       |
</docs>
