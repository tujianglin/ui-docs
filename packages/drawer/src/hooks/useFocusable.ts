import { useLockFocus } from '@vc-com/util/lib/Dom/focus';
import { computed, watch, type Ref } from 'vue';

export default function useFocusable(
  getContainer: () => HTMLElement,
  open: Ref<boolean>,
  autoFocus?: Ref<boolean>,
  focusTrap?: Ref<boolean>,
  mask?: Ref<boolean>,
) {
  const mergedFocusTrap = computed(() => focusTrap.value ?? mask.value !== false);

  // Focus lock
  const [ignoreElement] = useLockFocus(
    computed(() => open.value && mergedFocusTrap.value),
    getContainer,
  );

  // Auto Focus
  watch(
    open,
    () => {
      if (open.value && autoFocus.value === true) {
        getContainer()?.focus({ preventScroll: true });
      }
    },
    { immediate: true },
  );

  return ignoreElement;
}
