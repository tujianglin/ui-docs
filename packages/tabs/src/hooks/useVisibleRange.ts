// oxlint-disable no-unused-expressions
import { reactiveComputed, type ReactiveComputedReturn } from '@vueuse/core';
import type { Ref } from 'vue';
import type { Tab, TabOffsetMap } from '../interface';
import type { TabNavListProps } from '../TabNavList';

const DEFAULT_SIZE = { width: 0, height: 0, left: 0, top: 0, right: 0 };

export type ContainerSizeInfo = [width: number, height: number, left: number, top: number];

export default function useVisibleRange(
  tabOffsets: Ref<TabOffsetMap>,
  visibleTabContentValue: Ref<number>,
  transform: Ref<number>,
  tabContentSizeValue: Ref<number>,
  addNodeSizeValue: Ref<number>,
  operationNodeSizeValue: Ref<number>,
  tabsProps: ReactiveComputedReturn<{ tabs: Tab[] } & TabNavListProps>,
): ReactiveComputedReturn<{ visibleStart: number; visibleEnd: number }> {
  const { tabs, tabPosition, rtl } = $(tabsProps);
  const { charUnit, position, transformSize } = $(
    reactiveComputed(() => {
      let charUnit: 'width' | 'height';
      let position: 'left' | 'top' | 'right';
      let transformSize: number;

      if (['top', 'bottom'].includes(tabPosition)) {
        charUnit = 'width';
        position = rtl ? 'right' : 'left';
        transformSize = Math.abs(transform.value);
      } else {
        charUnit = 'height';
        position = 'top';
        transformSize = -transform.value;
      }
      return {
        charUnit,
        position,
        transformSize,
      };
    }),
  );

  return reactiveComputed(() => {
    tabContentSizeValue.value;
    addNodeSizeValue.value;
    operationNodeSizeValue.value;
    if (!tabs.length) {
      return { visibleStart: 0, visibleEnd: 0 };
    }

    const len = tabs.length;
    let endIndex = len;
    for (let i = 0; i < len; i += 1) {
      const offset = tabOffsets.value.get(tabs[i].key) || DEFAULT_SIZE;
      if (Math.floor(offset[position] + offset[charUnit]) > Math.floor(transformSize + visibleTabContentValue.value)) {
        endIndex = i - 1;
        break;
      }
    }

    let startIndex = 0;
    for (let i = len - 1; i >= 0; i -= 1) {
      const offset = tabOffsets.value.get(tabs[i].key) || DEFAULT_SIZE;
      if (offset[position] < transformSize) {
        startIndex = i + 1;
        break;
      }
    }

    return startIndex > endIndex ? { visibleStart: 0, visibleEnd: -1 } : { visibleStart: startIndex, visibleEnd: endIndex };
  });
}
