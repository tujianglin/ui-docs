import { computed, shallowRef, unref, watch, type ComputedRef } from 'vue';
import type { OnResize, SizeInfo } from '.';
import { observe, unobserve } from './utils/observerUtil';

export default function useResizeObserver(
  enabled: ComputedRef<boolean>,
  getTarget: ComputedRef<HTMLElement | (() => HTMLElement)>,
  onDelayResize?: OnResize,
  onSyncResize?: OnResize,
) {
  // ============================= Size =============================
  const sizeRef = shallowRef<SizeInfo>({
    width: -1,
    height: -1,
    offsetWidth: -1,
    offsetHeight: -1,
  });

  // =========================== Observe ============================

  // Handler
  const onInternalResize = (target) => {
    const { width, height } = target.getBoundingClientRect();
    const { offsetWidth, offsetHeight } = target;

    /**
     * Resize observer trigger when content size changed.
     * In most case we just care about element size,
     * let's use `boundary` instead of `contentRect` here to avoid shaking.
     */
    const fixedWidth = Math.floor(width);
    const fixedHeight = Math.floor(height);

    if (
      sizeRef.value.width !== fixedWidth ||
      sizeRef.value.height !== fixedHeight ||
      sizeRef.value.offsetWidth !== offsetWidth ||
      sizeRef.value.offsetHeight !== offsetHeight
    ) {
      const size = { width: fixedWidth, height: fixedHeight, offsetWidth, offsetHeight };
      sizeRef.value = size;

      // IE is strange, right?
      const mergedOffsetWidth = offsetWidth === Math.round(width) ? width : offsetWidth;
      const mergedOffsetHeight = offsetHeight === Math.round(height) ? height : offsetHeight;

      const sizeInfo = {
        ...size,
        offsetWidth: mergedOffsetWidth,
        offsetHeight: mergedOffsetHeight,
      };

      // Call the callback immediately, let the caller decide whether to defer
      // onResize(sizeInfo, target);
      onSyncResize?.(sizeInfo, target);

      // defer the callback but not defer to next frame
      Promise.resolve().then(() => {
        onDelayResize?.(sizeInfo, target);
      });
    }
  };

  // Dynamic observe
  const isFuncTarget = computed(() => typeof unref(getTarget) === 'function');

  watch(
    [enabled, () => (isFuncTarget.value ? 0 : getTarget.value)],
    (_n, _o, onCleanup) => {
      const target = isFuncTarget.value ? (getTarget.value as any)() : getTarget.value;

      if (target && enabled.value) {
        observe(target, onInternalResize);
      }

      onCleanup(() => {
        if (target) {
          unobserve(target, onInternalResize);
        }
      });
    },
    { immediate: true },
  );
}
