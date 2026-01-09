<script setup lang="ts">
import { Input } from '@vc-com/portal';
import { ref } from 'vue';

const val = ref('Hello Vapor SFC!');
</script>

<template>
  <Story title="Portal 传送门">
    <Variant title="基础用法">
      <div class="w-full max-w-md space-y-4">
        <h4 class="text-sm font-medium text-gray-500">Value: {{ val }}</h4>
        <Input
          description="A simple input demo in SFC"
          placeholder="Type something..."
          v-model:value="val"
          class="w-full rounded-md border border-gray-300 px-4 py-2 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
        />
      </div>
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
