import { computed, type Ref } from 'vue';
import type { DefaultOptionType, SearchConfig, SelectProps } from '../Select';

// Convert `showSearch` to unique config
export default function useSearchConfig(
  showSearch: Ref<boolean | SearchConfig<DefaultOptionType> | undefined>,
  mode: Ref<SelectProps<DefaultOptionType>['mode']>,
) {
  const result = computed<[boolean | undefined, SearchConfig<DefaultOptionType>]>(() => {
    const isObject = typeof showSearch?.value === 'object';
    const searchConfig = (isObject ? showSearch?.value : {}) as SearchConfig<DefaultOptionType>;
    searchConfig.autoClearSearchValue = searchConfig.autoClearSearchValue ?? true;
    return [
      isObject ||
      mode.value === 'combobox' ||
      mode.value === 'tags' ||
      (mode.value === 'multiple' && showSearch.value === undefined)
        ? true
        : showSearch.value,
      searchConfig,
    ] as any;
  });
  return [computed(() => result?.value?.[0]), computed(() => result?.value?.[1])] as const;
}
