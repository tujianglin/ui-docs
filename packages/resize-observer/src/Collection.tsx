import { defineComponent, shallowRef } from 'vue';
import type { SizeInfo } from '.';
import { CollectionContextProvider, useCollectionContextInject } from './context';

export interface ResizeInfo {
  size: SizeInfo;
  data: any;
  element: HTMLElement;
}

export interface CollectionProps {
  /** Trigger when some children ResizeObserver changed. Collect by frame render level */
  onBatchResize?: (resizeInfo: ResizeInfo[]) => void;
}

/**
 * Collect all the resize event from children ResizeObserver
 */
export const Collection = defineComponent(({ onBatchResize }: CollectionProps) => {
  const resizeIdRef = shallowRef(0);
  const resizeInfosRef = shallowRef<ResizeInfo[]>([]);

  const onCollectionResize = useCollectionContextInject();

  const onResize = (size, element, data) => {
    resizeIdRef.value += 1;
    const currentId = resizeIdRef.value;

    resizeInfosRef.value.push({
      size,
      element,
      data,
    });

    Promise.resolve().then(() => {
      if (currentId === resizeIdRef.value) {
        onBatchResize?.(resizeInfosRef.value);
        resizeInfosRef.value = [];
      }
    });

    // Continue bubbling if parent exist
    onCollectionResize?.(size, element, data);
  };

  const slots = defineSlots();

  return () => <CollectionContextProvider value={onResize}>{slots.default?.()}</CollectionContextProvider>;
});
