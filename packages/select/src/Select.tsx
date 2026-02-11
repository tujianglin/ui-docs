/**
 * To match accessibility requirement, we always provide an input in the component.
 * Other element will not set `tabIndex` to avoid `onBlur` sequence problem.
 * For focused select, we set `aria-live="polite"` to update the accessibility content.
 *
 * ref:
 * - keyboard: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/listbox_role#Keyboard_interactions
 *
 * New api:
 * - listHeight
 * - listItemHeight
 * - component
 *
 * Remove deprecated api:
 * - multiple
 * - tags
 * - combobox
 * - firstActiveValue
 * - dropdownMenuStyle
 * - openClassName (Not list in api)
 *
 * Update:
 * - `backfill` only support `combobox` mode
 * - `combobox` mode not support `labelInValue` since it's meaningless
 * - `getInputElement` only support `combobox` mode
 * - `onChange` return OptionData instead of ReactNode
 * - `filterOption` `onChange` `onSelect` accept OptionData instead of ReactNode
 * - `combobox` mode trigger `onChange` will get `undefined` if no `value` match in Option
 * - `combobox` mode not support `optionLabelProp`
 */

import useControlledState from '@vc-com/util/lib/hooks/useControlledState';
import { useId } from '@vc-com/util/lib/hooks/useId';
import type { RenderNode, VueNode } from '@vc-com/util/lib/types';
import { warning } from '@vc-com/util/lib/warning';
import { computed, defineComponent, isVNode, ref, shallowRef, watch, type CSSProperties } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import type {
  BaseSelectProps,
  BaseSelectPropsWithoutPrivate,
  BaseSelectSemanticName,
  DisplayInfoType,
  DisplayValueType,
} from './BaseSelect';
import BaseSelect, { isMultiple } from './BaseSelect';
import OptionList from './OptionList';
import { SelectContextProvider, type SelectContextProps } from './SelectContext';
import useCache from './hooks/useCache';
import useFilterOptions from './hooks/useFilterOptions';
import useOptions from './hooks/useOptions';
import useRefFunc from './hooks/useRefFunc';
import useSearchConfig from './hooks/useSearchConfig';
import type { FlattenOptionData } from './interface';
import { hasValue, isComboNoValue, toArray } from './utils/commonUtil';
import { fillFieldNames, flattenOptions, injectPropsWithOption } from './utils/valueUtil';

const OMIT_DOM_PROPS = ['inputValue'];

export type OnActiveValue = (active: RawValueType, index: number, info?: { source?: 'keyboard' | 'mouse' }) => void;

export type OnInternalSelect = (value: RawValueType, info: { selected: boolean }) => void;

export type RawValueType = string | number;
export interface LabelInValueType {
  label: RenderNode;
  value: RawValueType;
}

export type DraftValueType =
  | RawValueType
  | LabelInValueType
  | DisplayValueType
  | (RawValueType | LabelInValueType | DisplayValueType)[];

export type FilterFunc<OptionType> = (inputValue: string, option?: OptionType) => boolean;

export interface FieldNames {
  value?: string;
  label?: string;
  groupLabel?: string;
  options?: string;
}

export interface BaseOptionType {
  disabled?: boolean;
  class?: string;
  title?: string;
  [name: string]: any;
}

export interface DefaultOptionType extends BaseOptionType {
  label?: RenderNode;
  value?: string | number | null;
  children?: Omit<DefaultOptionType, 'children'>[];
}

export type SelectHandler<ValueType, OptionType extends BaseOptionType = DefaultOptionType> = (
  value: ValueType,
  option: OptionType,
) => void;

type ArrayElementType<T> = T extends (infer E)[] ? E : T;

export type SemanticName = BaseSelectSemanticName;
export type PopupSemantic = 'listItem' | 'list';
export interface SearchConfig<OptionType> {
  searchValue?: string;
  autoClearSearchValue?: boolean;
  onSearch?: (value: string) => void;
  filterOption?: boolean | FilterFunc<OptionType>;
  filterSort?: (optionA: OptionType, optionB: OptionType, info: { searchValue: string }) => number;
  optionFilterProp?: string | string[];
}
export interface SelectProps<ValueType = any, OptionType extends BaseOptionType = DefaultOptionType> extends Omit<
  BaseSelectPropsWithoutPrivate,
  'showSearch'
> {
  prefixCls?: string;
  id?: string;

  backfill?: boolean;

  // >>> Field Names
  fieldNames?: FieldNames;
  showSearch?: boolean | SearchConfig<OptionType>;

  // >>> Select
  onSelect?: SelectHandler<ArrayElementType<ValueType>, OptionType>;
  onDeselect?: SelectHandler<ArrayElementType<ValueType>, OptionType>;
  onActive?: (value: ValueType) => void;

  optionLabelProp?: string;

  options?: OptionType[];
  optionRender?: (oriOption: FlattenOptionData<OptionType>, info: { index: number }) => VueNode;
  defaultActiveFirstOption?: boolean;
  virtual?: boolean;
  direction?: 'ltr' | 'rtl';
  listHeight?: number;
  listItemHeight?: number;
  labelRender?: (props: LabelInValueType) => VueNode;

  // >>> Icon
  menuItemSelectedIcon?: RenderNode;

  mode?: 'combobox' | 'multiple' | 'tags';
  labelInValue?: boolean;
  value?: ValueType | null;
  defaultValue?: ValueType | null;
  maxCount?: number;
  onChange?: (value: ValueType, option?: OptionType | OptionType[]) => void;
  classNames?: Partial<Record<SemanticName, string>>;
  styles?: Partial<Record<SemanticName, CSSProperties>>;
}

function isRawValue(value: DraftValueType): value is RawValueType {
  return !value || typeof value !== 'object';
}

const Select = defineComponent(
  ({
    id,
    mode,
    prefixCls = 'rc-select',
    backfill,
    fieldNames,
    // Search
    showSearch,

    // Select
    onSelect,
    onDeselect,
    onActive,
    popupMatchSelectWidth: selecWidth,
    optionLabelProp,
    options,
    optionRender,
    defaultActiveFirstOption,
    menuItemSelectedIcon,
    virtual,
    direction,
    listHeight = 200,
    listItemHeight = 20,
    labelRender,

    // Value
    value,
    defaultValue,
    labelInValue,
    onChange,
    maxCount,
    classNames,
    styles,
    ...restProps
  }: SelectProps<any, DefaultOptionType>) => {
    const popupMatchSelectWidth = computed(() => selecWidth ?? true);
    const [mergedShowSearch, searchConfig] = useSearchConfig(
      computed(() => showSearch),
      computed(() => mode),
    );
    const { filterOption, searchValue, optionFilterProp, filterSort, onSearch, autoClearSearchValue } = $(searchConfig.value);

    const normalizedOptionFilterProp = computed(() => {
      if (!optionFilterProp) return [];
      return Array.isArray(optionFilterProp) ? optionFilterProp : [optionFilterProp];
    });

    const mergedId = useId(id);
    const multiple = computed(() => isMultiple(mode));

    const mergedFilterOption = computed(() => {
      if (filterOption === undefined && mode === 'combobox') {
        return false;
      }
      return filterOption;
    });

    // ========================= FieldNames =========================
    const mergedFieldNames = computed(() => fillFieldNames(fieldNames));

    // =========================== Search ===========================
    const [internalSearchValue, setSearchValue] = useControlledState(
      '',
      computed(() => searchValue),
    );
    const mergedSearchValue = computed(() => internalSearchValue.value || '');

    // =========================== Option ===========================
    const parsedOptions = useOptions(
      computed(() => options),
      mergedFieldNames,
      normalizedOptionFilterProp,
      computed(() => optionLabelProp),
    );

    const valueOptions = computed(() => parsedOptions.value?.valueOptions);
    const labelOptions = computed(() => parsedOptions.value?.labelOptions);
    const mergedOptions = computed(() => parsedOptions.value?.options);

    // ========================= Wrap Value =========================
    const convert2LabelValues = (draftValues: DraftValueType) => {
      // Convert to array
      const valueList = toArray(draftValues);

      // Convert to labelInValue type
      return valueList.map((val) => {
        let rawValue: RawValueType;
        let rawLabel: RenderNode;
        let rawDisabled: boolean | undefined;
        let rawTitle: string;

        // Fill label & value
        if (isRawValue(val)) {
          rawValue = val;
        } else {
          rawLabel = val.label;
          rawValue = val.value;
        }

        const option = valueOptions.value.get(rawValue);
        if (option) {
          // Fill missing props
          if (rawLabel === undefined) rawLabel = option?.[optionLabelProp || mergedFieldNames.value.label];
          rawDisabled = option?.disabled;
          rawTitle = option?.title;

          // Warning if label not same as provided
          if (process.env.NODE_ENV !== 'production' && !optionLabelProp) {
            const optionLabel = option?.[mergedFieldNames.value.label];
            if (optionLabel !== undefined && !isVNode(optionLabel) && !isVNode(rawLabel) && optionLabel !== rawLabel) {
              warning(false, '`label` of `value` is not same as `label` in Select options.');
            }
          }
        }

        return {
          label: rawLabel,
          value: rawValue,
          key: rawValue,
          disabled: rawDisabled,
          title: rawTitle,
        };
      });
    };

    // =========================== Values ===========================
    const [internalValue, setInternalValue] = useControlledState(
      defaultValue,
      computed(() => value),
    );

    // Merged value with LabelValueType
    const rawLabeledValues = computed(() => {
      const newInternalValue = multiple.value && internalValue.value === null ? [] : internalValue.value;
      const values = convert2LabelValues(newInternalValue);

      // combobox no need save value when it's no value (exclude value equal 0)
      if (mode === 'combobox' && isComboNoValue(values[0]?.value)) {
        return [];
      }

      return values;
    });

    // Fill label with cache to avoid option remove
    const [mergedValues, getMixedOption] = useCache(rawLabeledValues, valueOptions);

    const displayValues = computed(() => {
      // `null` need show as placeholder instead
      // https://github.com/ant-design/ant-design/issues/25057
      if (!mode && mergedValues.value.length === 1) {
        const firstValue = mergedValues.value[0];
        if (firstValue.value === null && (firstValue.label === null || firstValue.label === undefined)) {
          return [];
        }
      }

      return mergedValues.value.map((item) => ({
        ...item,
        label: (typeof labelRender === 'function' ? labelRender(item) : item.label) ?? item.value,
      }));
    });

    /** Convert `displayValues` to raw value type set */
    const rawValues = computed(() => new Set(mergedValues.value.map((val) => val.value)));

    watch(
      [mergedValues],
      () => {
        if (mode === 'combobox') {
          const strValue = mergedValues.value[0]?.value;
          setSearchValue(hasValue(strValue) ? String(strValue) : '');
        }
      },
      { immediate: true, deep: true },
    );

    // ======================= Display Option =======================
    // Create a placeholder item if not exist in `options`
    const createTagOption = useRefFunc((val: RawValueType, label?: RenderNode) => {
      const mergedLabel = label ?? val;
      return {
        [mergedFieldNames.value.value]: val,
        [mergedFieldNames.value.label]: mergedLabel,
      } as DefaultOptionType;
    });

    // Fill tag as option if mode is `tags`
    const filledTagOptions = computed(() => {
      if (mode !== 'tags') {
        return mergedOptions.value;
      }

      // >>> Tag mode
      const cloneOptions = [...mergedOptions.value];

      // Check if value exist in options (include new patch item)
      const existOptions = (val: RawValueType) => valueOptions.value.has(val);

      // Fill value value as option
      [...mergedValues.value]
        .sort((a, b) => (a.value < b.value ? -1 : 1))
        .forEach((item) => {
          const val = item.value;

          if (!existOptions(val)) {
            cloneOptions.push(createTagOption(val, item.label));
          }
        });

      return cloneOptions;
    });

    const filteredOptions = useFilterOptions(
      filledTagOptions,
      mergedFieldNames,
      mergedSearchValue,
      mergedFilterOption,
      normalizedOptionFilterProp,
    );

    // Fill options with search value if needed
    const filledSearchOptions = computed(() => {
      const hasItemMatchingSearch = (item: DefaultOptionType) => {
        if (normalizedOptionFilterProp.value.length) {
          return normalizedOptionFilterProp.value.some((prop) => item?.[prop] === mergedSearchValue);
        }
        return item?.value === mergedSearchValue.value;
      };
      if (mode !== 'tags' || !mergedSearchValue.value || filteredOptions.value.some((item) => hasItemMatchingSearch(item))) {
        return filteredOptions.value;
      }
      // ignore when search value equal select input value
      if (filteredOptions.value.some((item) => item[mergedFieldNames.value.value] === mergedSearchValue.value)) {
        return filteredOptions.value;
      }
      // Fill search value as option
      return [createTagOption(mergedSearchValue.value), ...filteredOptions.value];
    });
    const sorter = (inputOptions: DefaultOptionType[]) => {
      const sortedOptions = [...inputOptions].sort((a, b) => filterSort(a, b, { searchValue: mergedSearchValue.value }));
      return sortedOptions.map((item) => {
        if (Array.isArray(item.options)) {
          return {
            ...item,
            options: item.options.length > 0 ? sorter(item.options) : item.options,
          };
        }
        return item;
      });
    };
    const orderedFilteredOptions = computed(() => {
      if (!filterSort) {
        return filledSearchOptions.value;
      }

      return sorter(filledSearchOptions.value);
    });

    const displayOptions = computed(() =>
      flattenOptions(orderedFilteredOptions.value, {
        fieldNames: mergedFieldNames.value,
      }),
    );

    // =========================== Change ===========================
    const triggerChange = (values: DraftValueType) => {
      const labeledValues = convert2LabelValues(values);
      setInternalValue(labeledValues);

      if (
        onChange &&
        // Trigger event only when value changed
        (labeledValues.length !== mergedValues.value.length ||
          labeledValues.some((newVal, index) => mergedValues.value[index]?.value !== newVal?.value))
      ) {
        const returnValues = labelInValue
          ? labeledValues.map(({ label: l, value: v }) => ({ label: l, value: v }))
          : labeledValues.map((v) => v.value);

        const returnOptions = labeledValues.map((v) => injectPropsWithOption(getMixedOption(v.value)));

        onChange(
          // Value
          multiple.value ? returnValues : returnValues[0],
          // Option
          multiple.value ? returnOptions : returnOptions[0],
        );
      }
    };

    // ======================= Accessibility ========================
    const activeValue = ref<string>(null);
    const accessibilityIndex = ref(0);
    const mergedDefaultActiveFirstOption = computed(() =>
      defaultActiveFirstOption !== undefined ? defaultActiveFirstOption : mode !== 'combobox',
    );

    const activeEventRef = shallowRef<Promise<void>>();

    const onActiveValue: OnActiveValue = (active, index, { source = 'keyboard' } = {}) => {
      accessibilityIndex.value = index;

      if (backfill && mode === 'combobox' && active !== null && source === 'keyboard') {
        activeValue.value = String(active);
      }

      // Active will call multiple times.
      // We only need trigger the last one.
      const promise = Promise.resolve().then(() => {
        if (activeEventRef.value === promise) {
          onActive?.(active);
        }
      });
      activeEventRef.value = promise;
    };

    // ========================= OptionList =========================
    const triggerSelect = (val: RawValueType, selected: boolean, type?: DisplayInfoType) => {
      const getSelectEnt = (): [RawValueType | LabelInValueType, DefaultOptionType] => {
        const option = getMixedOption(val);
        return [
          labelInValue
            ? {
                label: option?.[mergedFieldNames.value.label],
                value: val,
              }
            : val,
          injectPropsWithOption(option),
        ];
      };

      if (selected && onSelect) {
        const [wrappedValue, option] = getSelectEnt();
        onSelect(wrappedValue, option);
      } else if (!selected && onDeselect && type !== 'clear') {
        const [wrappedValue, option] = getSelectEnt();
        onDeselect(wrappedValue, option);
      }
    };

    // Used for OptionList selection
    const onInternalSelect = useRefFunc<OnInternalSelect>((val, info) => {
      let cloneValues: (RawValueType | DisplayValueType)[];

      // Single mode always trigger select only with option list
      const mergedSelect = multiple.value ? info.selected : true;

      if (mergedSelect) {
        cloneValues = multiple.value ? [...mergedValues.value, val] : [val];
      } else {
        cloneValues = mergedValues.value.filter((v) => v.value !== val);
      }

      triggerChange(cloneValues);
      triggerSelect(val, mergedSelect);

      // Clean search value if single or configured
      if (mode === 'combobox') {
        activeValue.value = '';
      } else if (!isMultiple || autoClearSearchValue) {
        setSearchValue('');
        activeValue.value = '';
      }
    });

    // ======================= Display Change =======================
    // BaseSelect display values change
    const onDisplayValuesChange: BaseSelectProps['onDisplayValuesChange'] = (nextValues, info) => {
      triggerChange(nextValues);
      const { type, values } = info;

      if (type === 'remove' || type === 'clear') {
        values.forEach((item) => {
          triggerSelect(item.value, false, type);
        });
      }
    };

    // =========================== Search ===========================
    const onInternalSearch: BaseSelectProps['onSearch'] = (searchText, info) => {
      setSearchValue(searchText);
      activeValue.value = null;

      // [Submit] Tag mode should flush input
      if (info.source === 'submit') {
        const formatted = (searchText || '').trim();
        // prevent empty tags from appearing when you click the Enter button
        if (formatted) {
          const newRawValues = Array.from(new Set<RawValueType>([...rawValues.value, formatted]));
          triggerChange(newRawValues);
          triggerSelect(formatted, true);
          setSearchValue('');
        }

        return;
      }

      if (info.source !== 'blur') {
        if (mode === 'combobox') {
          triggerChange(searchText);
        }

        onSearch?.(searchText);
      }
    };

    const onInternalSearchSplit: BaseSelectProps['onSearchSplit'] = (words) => {
      let patchValues: RawValueType[] = words;

      if (mode !== 'tags') {
        patchValues = words
          .map((word) => {
            const opt = labelOptions.value.get(word);
            return opt?.value;
          })
          .filter((val) => val !== undefined);
      }

      const newRawValues = Array.from(new Set<RawValueType>([...rawValues.value, ...patchValues]));
      triggerChange(newRawValues);
      newRawValues.forEach((newRawValue) => {
        triggerSelect(newRawValue, true);
      });
    };

    // ========================== Context ===========================
    const selectContext = computed<SelectContextProps>(() => {
      const realVirtual = virtual !== false && popupMatchSelectWidth.value !== false;
      return {
        ...parsedOptions.value,
        flattenOptions: displayOptions.value,
        onActiveValue,
        defaultActiveFirstOption: mergedDefaultActiveFirstOption.value,
        onSelect: onInternalSelect,
        menuItemSelectedIcon,
        rawValues: rawValues.value,
        fieldNames: mergedFieldNames.value,
        virtual: realVirtual,
        direction,
        listHeight,
        listItemHeight,
        maxCount,
        optionRender,
        classNames,
        styles,
      };
    });

    const domRef = useRef();
    // ==============================================================
    // ==                          Render                          ==
    // ==============================================================
    return () => (
      <SelectContextProvider value={selectContext.value}>
        <BaseSelect
          {...restProps}
          // >>> MISC
          id={mergedId.value}
          prefixCls={prefixCls}
          ref={domRef}
          omitDomProps={OMIT_DOM_PROPS}
          mode={mode}
          // >>> Style
          classNames={classNames}
          styles={styles}
          // >>> Values
          displayValues={displayValues.value}
          onDisplayValuesChange={onDisplayValuesChange}
          maxCount={maxCount}
          // >>> Trigger
          direction={direction}
          // >>> Search
          showSearch={mergedShowSearch.value}
          searchValue={mergedSearchValue.value}
          onSearch={onInternalSearch}
          autoClearSearchValue={autoClearSearchValue}
          onSearchSplit={onInternalSearchSplit}
          popupMatchSelectWidth={popupMatchSelectWidth.value}
          // >>> OptionList
          OptionList={OptionList}
          emptyOptions={!displayOptions.value.length}
          // >>> Accessibility
          activeValue={activeValue.value}
          activeDescendantId={`${mergedId.value}_list_${accessibilityIndex.value}`}
        />
      </SelectContextProvider>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'Select' : undefined },
);

export default Select;
