import { defineComponent, inject, provide, shallowRef, type InjectionKey } from 'vue';
import type { SizeInfo } from '.';

type onCollectionResize = (size: SizeInfo, element: HTMLElement, data: any) => void;

const CollectionContext: InjectionKey<onCollectionResize> = Symbol('CollectionContext');

export const useCollectionContextInject = () => {
  return inject(CollectionContext, null);
};

export const CollectionContextProvider = defineComponent(({ value }: { value: onCollectionResize }) => {
  const slots = defineSlots({ default: () => <></> });
  provide(CollectionContext, value);
  return () => <slots.default />;
});

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
  const slots = defineSlots({ default: () => <></> });

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

  return () => (
    <CollectionContextProvider value={onResize}>
      <slots.default />
    </CollectionContextProvider>
  );
});
