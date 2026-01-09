<script lang="tsx" setup>
import { Input } from '@vc-com/portal';
import { ref } from 'vue';
const val = ref('Hello Vapor SFC!');
</script>
<template>
  <Input
    description="A simple input demo in SFC"
    placeholder="Type something..."
    v-model:value="val"
    class="w-full rounded-md border border-gray-300 px-4 py-2 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
  />
</template>
