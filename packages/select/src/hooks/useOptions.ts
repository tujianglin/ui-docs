import type { VueNode } from '@vc-com/util/lib/types';
import { computed, type Ref } from 'vue';
import type { FieldNames, RawValueType } from '../Select';

/**
 * Parse `children` to `options` if `options` is not provided.
 * Then flatten the `options`.
 */
const useOptions = <OptionType>(
  options: Ref<OptionType[]>,
  fieldNames: Ref<FieldNames>,
  optionFilterProp: Ref<string[]>,
  optionLabelProp: Ref<string>,
) => {
  return computed(() => {
    let mergedOptions = options.value;

    const valueOptions = new Map<RawValueType, OptionType>();
    const labelOptions = new Map<VueNode, OptionType>();

    const setLabelOptions = (labelOptionsMap: Map<VueNode, OptionType>, option: OptionType, key: string | number) => {
      if (key && typeof key === 'string') {
        labelOptionsMap.set(option[key], option);
      }
    };

    const dig = (optionList: OptionType[], isChildren = false) => {
      // for loop to speed up collection speed
      for (let i = 0; i < optionList.length; i += 1) {
        const option = optionList[i];
        if (!option[fieldNames.value.options] || isChildren) {
          valueOptions.set(option[fieldNames.value.value], option);
          setLabelOptions(labelOptions, option, fieldNames.value.label);
          // https://github.com/ant-design/ant-design/issues/35304
          optionFilterProp.value.forEach((prop) => {
            setLabelOptions(labelOptions, option, prop);
          });
          setLabelOptions(labelOptions, option, optionLabelProp.value);
        } else {
          dig(option[fieldNames.value.options], true);
        }
      }
    };

    dig(mergedOptions);
    return {
      options: mergedOptions,
      valueOptions,
      labelOptions,
    };
  });
};

export default useOptions;
