import { defineComponent, ref, watch, watchEffect } from 'vue';
import { generateTrigger, UniqueProvider } from './index';

interface MockPortalProps {
  open?: boolean;
  autoDestroy?: boolean;
  getContainer?: () => HTMLElement;
}

const MockPortal = defineComponent(({ open, autoDestroy, getContainer }: MockPortalProps) => {
  const visible = ref(open);
  const slots = defineSlots({ default: () => <></> });

  watchEffect(() => {
    getContainer?.();
  });

  watch(
    [() => open, () => autoDestroy],
    () => {
      if (open) {
        visible.value = true;
      } else if (autoDestroy) {
        visible.value = false;
      }
    },
    { immediate: true },
  );

  return () => (visible ? <slots.default /> : null);
});

export default generateTrigger(MockPortal);

export { UniqueProvider };
