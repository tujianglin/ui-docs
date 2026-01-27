import { shallowRef, watch, type Ref } from 'vue';
import type { GetKey } from '../interface';
import { findListDiffIndex } from '../utils/algorithmUtil';

export default function useDiffItem<T>(data: Ref<T[]>, getKey: GetKey<T>, onDiff?: (diffIndex: number) => void): [Ref<T>] {
  const prevData = shallowRef(data.value);
  const diffItem = shallowRef(null);

  watch(
    data,
    () => {
      const diff = findListDiffIndex(prevData.value || [], data.value || [], getKey);
      if (diff?.index !== undefined) {
        onDiff?.(diff.index);
        diffItem.value = data.value[diff.index];
      }
      prevData.value = data.value;
    },
    { immediate: true, deep: true },
  );

  return [diffItem];
}
