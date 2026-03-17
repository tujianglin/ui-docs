<script setup lang="ts">
import { shallowRef, watchEffect } from 'vue';

interface PopupContentProps {
  shouldUpdate?: boolean;
}

const props = defineProps<PopupContentProps>();

// 用来缓存上一次渲染的内容
const cachedVNode = shallowRef();

watchEffect(() => {
  if (!props.shouldUpdate) {
    // 不缓存时，重新渲染
    cachedVNode.value = undefined;
  }
});
</script>

<template>
  <slot v-if="!props.shouldUpdate || !cachedVNode" v-bind="{ ref: (el) => (cachedVNode = el) }"></slot>
  <template v-else>
    <component :is="cachedVNode" />
  </template>
</template>
