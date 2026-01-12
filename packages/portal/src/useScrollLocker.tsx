import { removeCSS, updateCSS } from '@vc-com/util/lib/Dom/dynamicCSS';
import { getTargetScrollBarSize } from '@vc-com/util/lib/getScrollBarSize';
import { computed, nextTick, watch, type ComputedRef } from 'vue';
import { isBodyOverflowing } from './util';

const UNIQUE_ID = `rc-util-locker-${Date.now()}`;

let uuid = 0;

export default function useScrollLocker(lock?: ComputedRef<boolean>) {
  const mergedLock = computed(() => !!lock.value);
  const id = computed(() => {
    uuid += 1;
    return `${UNIQUE_ID}_${uuid}`;
  });

  watch(
    [mergedLock, id],
    async (_n, _o, onCleanup) => {
      await nextTick();
      if (mergedLock.value) {
        const scrollbarSize = getTargetScrollBarSize(document.body).width;
        const isOverflow = isBodyOverflowing();

        updateCSS(
          `
html body {
  overflow-y: hidden;
  ${isOverflow ? `width: calc(100% - ${scrollbarSize}px);` : ''}
}`,
          id.value,
        );
      } else {
        removeCSS(id.value);
      }
      onCleanup(() => removeCSS(id.value));
    },
    { flush: 'post', immediate: true },
  );
}
