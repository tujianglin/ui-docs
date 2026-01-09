<script setup lang="ts">
import { Input } from '@vc-com/portal';
import { ref } from 'vue';

const count = ref(0);
const increment = () => count.value++;
</script>

<template>
  <div class="w-full max-w-md space-y-6">
    <div class="flex items-center justify-between">
      <span class="text-sm font-semibold text-gray-700">Counter Integration</span>
      <button
        @click="increment"
        class="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-200"
      >
        Increment
      </button>
    </div>
    <Input
      :count="count"
      :flag="count > 5"
      placeholder="Check flags..."
      class="w-full rounded-md border border-gray-300 px-4 py-2 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
    />
    <p class="text-xs text-gray-400">Flags turn true when count {{ '>' }} 5</p>
  </div>
</template>

<docs lang="md">
# Advanced Features

Testing flags and counters in the portal component.

## Features

- Dynamic flag switching based on external state.
- Counter prop integration.

## Props used

- `count`: number
- `flag`: boolean
</docs>
