import { computed, ref, type ComputedRef, type Ref } from 'vue';
import type { RenderNode } from '../../../util/src/types';
import type { DisplayValueType, Mode } from '../interface';

export interface AllowClearConfig {
  allowClear: boolean;
  clearIcon: RenderNode;
}

export const useAllowClear = (
  _prefixCls: Ref<string>,
  displayValues: Ref<DisplayValueType[]>,
  allowClear?: Ref<boolean | { clearIcon?: RenderNode }>,
  disabled: Ref<boolean> = ref(false),
  mergedSearchValue?: Ref<string>,
  mode?: Ref<Mode>,
): ComputedRef<AllowClearConfig> => {
  // Convert boolean to object first
  const allowClearConfig = computed<Partial<AllowClearConfig>>(() => {
    if (typeof allowClear.value === 'boolean') {
      return { allowClear: allowClear.value };
    }
    if (allowClear.value && typeof allowClear.value === 'object') {
      return allowClear.value;
    }
    return { allowClear: false };
  });

  return computed(() => {
    const mergedAllowClear =
      !disabled.value &&
      allowClearConfig.value.allowClear !== false &&
      (displayValues.value.length || mergedSearchValue.value) &&
      !(mode.value === 'combobox' && mergedSearchValue.value === '');

    return {
      allowClear: mergedAllowClear,
      clearIcon: mergedAllowClear ? allowClearConfig.value.clearIcon || '×' : null,
    };
  });
};
