import raf from '@vc-com/util/lib/raf';
import type { ReactiveComputedReturn } from '@vueuse/core';
import { computed, ref, shallowRef, watch, type CSSProperties } from 'vue';
import type { TabOffset } from '../interface';

export type GetIndicatorSize = number | ((origin: number) => number);

interface UseIndicatorOptions {
  activeTabOffset: TabOffset;
  horizontal: boolean;
  rtl: boolean;
  indicator?: {
    size?: GetIndicatorSize;
    align?: 'start' | 'center' | 'end';
  };
}

const useIndicator = (options: ReactiveComputedReturn<UseIndicatorOptions>) => {
  const { activeTabOffset, horizontal, rtl, indicator = {} } = $(options);

  const size = computed(() => indicator?.size);
  const align = computed(() => indicator?.align || 'center');

  const inkStyle = ref<CSSProperties>();
  const inkBarRafRef = shallowRef<number>();

  const getLength = (origin: number) => {
    if (typeof size.value === 'function') {
      return size.value(origin);
    }
    if (typeof size.value === 'number') {
      return size.value;
    }
    return origin;
  };

  // Delay set ink style to avoid remove tab blink
  function cleanInkBarRaf() {
    raf.cancel(inkBarRafRef.value);
  }

  watch([() => activeTabOffset, () => horizontal, () => rtl, align], (_n, _o, onCleanup) => {
    const newInkStyle: CSSProperties = {};

    if (activeTabOffset) {
      if (horizontal) {
        newInkStyle.width = `${getLength(activeTabOffset.width)}px`;
        const key = rtl ? 'right' : 'left';
        if (align.value === 'start') {
          newInkStyle[key] = `${activeTabOffset[key]}px`;
        }
        if (align.value === 'center') {
          newInkStyle[key] = `${activeTabOffset[key] + activeTabOffset.width / 2}px`;
          newInkStyle.transform = rtl ? 'translateX(50%)' : 'translateX(-50%)';
        }
        if (align.value === 'end') {
          newInkStyle[key] = `${activeTabOffset[key] + activeTabOffset.width}px`;
          newInkStyle.transform = 'translateX(-100%)';
        }
      } else {
        newInkStyle.height = `${getLength(activeTabOffset.height)}px`;
        if (align.value === 'start') {
          newInkStyle.top = `${activeTabOffset.top}px`;
        }
        if (align.value === 'center') {
          newInkStyle.top = `${activeTabOffset.top + activeTabOffset.height / 2}px`;
          newInkStyle.transform = 'translateY(-50%)';
        }
        if (align.value === 'end') {
          newInkStyle.top = `${activeTabOffset.top + activeTabOffset.height}px`;
          newInkStyle.transform = 'translateY(-100%)';
        }
      }
    }

    cleanInkBarRaf();
    inkBarRafRef.value = raf(() => {
      // Avoid jitter caused by tiny numerical differences
      // fix https://github.com/ant-design/ant-design/issues/53378
      const isEqual =
        inkStyle.value &&
        newInkStyle &&
        Object.keys(newInkStyle).every((key) => {
          const newValue = newInkStyle[key];
          const oldValue = inkStyle.value[key];
          return typeof newValue === 'number' && typeof oldValue === 'number'
            ? Math.round(newValue) === Math.round(oldValue)
            : newValue === oldValue;
        });
      if (!isEqual) {
        inkStyle.value = newInkStyle;
      }
    });

    onCleanup(cleanInkBarRaf);
  });

  return { style: inkStyle };
};

export default useIndicator;
