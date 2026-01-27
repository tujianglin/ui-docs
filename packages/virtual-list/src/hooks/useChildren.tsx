import { computed, type Ref } from 'vue';
import type { RenderFunc, SharedConfig } from '../interface';
import { Item } from '../Item';

export default function useChildren<T>(
  list: Ref<T[]>,
  startIndex: Ref<number>,
  endIndex: Ref<number>,
  scrollWidth: Ref<number>,
  offsetX: Ref<number>,
  setNodeRef: (item: T, element: HTMLElement) => void,
  renderFunc: RenderFunc<T>,
  { getKey }: SharedConfig<T>,
) {
  return computed(() => {
    return list.value.slice(startIndex.value, endIndex.value + 1).map((item, index) => {
      const eleIndex = startIndex.value + index;
      const node = renderFunc(item, eleIndex, {
        style: {
          width: `${scrollWidth.value}px`,
        },
        offsetX: offsetX.value,
      });

      const key = getKey(item);
      return (
        <Item key={key} setRef={(ele) => setNodeRef(item, ele)}>
          {node}
        </Item>
      );
    });
  });
}
