import type { BaseSelectProps, BaseSelectPropsWithoutPrivate, BaseSelectRef } from '@vc-com/select';
import { BaseSelect } from '@vc-com/select';
import type { DisplayValueType, Placement } from '@vc-com/select/BaseSelect';
import type { BuildInPlacements } from '@vc-com/trigger/interface';
import useControlledState from '@vc-com/util/lib/hooks/useControlledState';
import { useId } from '@vc-com/util/lib/hooks/useId';
import type { RenderNode, VueNode } from '@vc-com/util/lib/types';
import { filterEmpty } from '@vc-com/util/src/props-util';
import { reactiveComputed } from '@vueuse/core';
import { isEmpty } from 'es-toolkit/compat';
import { computed, defineComponent, getCurrentInstance, type CSSProperties } from 'vue';
import { CascaderContextProvider } from './context';
import useDisplayValues from './hooks/useDisplayValues';
import useMissingValues from './hooks/useMissingValues';
import useOptions from './hooks/useOptions';
import useSearchOptions from './hooks/useSearchOptions';
import useSelect from './hooks/useSelect';
import useValues from './hooks/useValues';
import OptionList from './OptionList';
import { fillFieldNames, SHOW_CHILD, SHOW_PARENT, toPathKeys, toRawValues } from './utils/commonUtil';
import { formatStrategyValues, toPathOptions } from './utils/treeUtil';
import { warningNullOptions } from './utils/warningPropsUtil';

export interface BaseOptionType {
  disabled?: boolean;
  disableCheckbox?: boolean;
  label?: RenderNode;
  value?: string | number | null;
  children?: DefaultOptionType[];
}

export type DefaultOptionType = BaseOptionType & Record<string, any>;

export interface SearchConfig<
  OptionType extends DefaultOptionType = DefaultOptionType,
  ValueField extends keyof OptionType = keyof OptionType,
> {
  filter?: (inputValue: string, options: OptionType[], fieldNames: FieldNames<OptionType, ValueField>) => boolean;
  render?: (inputValue: string, path: OptionType[], prefixCls: string, fieldNames: FieldNames<OptionType, ValueField>) => VueNode;
  sort?: (a: OptionType[], b: OptionType[], inputValue: string, fieldNames: FieldNames<OptionType, ValueField>) => number;
  matchInputWidth?: boolean;
  limit?: number | false;
  searchValue?: string;
  onSearch?: (value: string) => void;
  autoClearSearchValue?: boolean;
}

export type ShowCheckedStrategy = typeof SHOW_PARENT | typeof SHOW_CHILD;

interface BaseCascaderProps<
  OptionType extends DefaultOptionType = DefaultOptionType,
  ValueField extends keyof OptionType = keyof OptionType,
> extends Omit<BaseSelectPropsWithoutPrivate, 'tokenSeparators' | 'labelInValue' | 'mode' | 'showSearch'> {
  // MISC
  id?: string;
  prefixCls?: string;
  fieldNames?: FieldNames<OptionType, ValueField>;
  optionRender?: (option: OptionType) => VueNode;

  // Value
  changeOnSelect?: boolean;
  displayRender?: (label: string[], selectedOptions?: OptionType[]) => VueNode;
  checkable?: boolean | RenderNode;
  showCheckedStrategy?: ShowCheckedStrategy;

  // Search
  showSearch?: boolean | SearchConfig<OptionType>;

  // Trigger
  expandTrigger?: 'hover' | 'click';

  // Options
  options?: OptionType[];
  /** @private Internal usage. Do not use in your production. */
  popupPrefixCls?: string;
  loadData?: (selectOptions: OptionType[]) => void;

  popupClassName?: string;
  popupMenuColumnStyle?: CSSProperties;

  placement?: Placement;
  builtinPlacements?: BuildInPlacements;

  onPopupVisibleChange?: (open: boolean) => void;

  // Icon
  expandIcon?: RenderNode;
  loadingIcon?: RenderNode;
}

export interface FieldNames<
  OptionType extends DefaultOptionType = DefaultOptionType,
  ValueField extends keyof OptionType = keyof OptionType,
> {
  label?: keyof OptionType;
  value?: keyof OptionType | ValueField;
  children?: keyof OptionType;
}

export type ValueType<
  OptionType extends DefaultOptionType = DefaultOptionType,
  ValueField extends keyof OptionType = keyof OptionType,
> = keyof OptionType extends ValueField
  ? unknown extends OptionType['value']
    ? OptionType[ValueField]
    : OptionType['value']
  : OptionType[ValueField];

export type GetValueType<
  OptionType extends DefaultOptionType = DefaultOptionType,
  ValueField extends keyof OptionType = keyof OptionType,
  Multiple extends boolean | RenderNode = boolean,
> = false extends Multiple ? ValueType<Required<OptionType>, ValueField>[] : ValueType<Required<OptionType>, ValueField>[][];

export type GetOptionType<
  OptionType extends DefaultOptionType = DefaultOptionType,
  Multiple extends boolean | RenderNode = boolean,
> = false extends Multiple ? OptionType[] : OptionType[][];

type SemanticName = 'input' | 'prefix' | 'suffix' | 'placeholder' | 'content' | 'item' | 'itemContent' | 'itemRemove';
type PopupSemantic = 'list' | 'listItem';
export interface CascaderProps<
  OptionType extends DefaultOptionType = DefaultOptionType,
  ValueField extends keyof OptionType = keyof OptionType,
  Multiple extends boolean | RenderNode = boolean,
> extends BaseCascaderProps<OptionType, ValueField> {
  styles?: Partial<Record<SemanticName, CSSProperties>> & {
    popup?: Partial<Record<PopupSemantic, CSSProperties>>;
  };
  classNames?: Partial<Record<SemanticName, string>> & {
    popup?: Partial<Record<PopupSemantic, string>>;
  };
  checkable?: Multiple;
  value?: GetValueType<OptionType, ValueField, Multiple>;
  defaultValue?: GetValueType<OptionType, ValueField, Multiple>;
  onChange?: (value: GetValueType<OptionType, ValueField, Multiple>, selectOptions: GetOptionType<OptionType, Multiple>) => void;
}

export type SingleValueType = (string | number)[];

export type LegacyKey = string | number;

export type InternalValueType = SingleValueType | SingleValueType[];

export interface InternalFieldNames extends Required<FieldNames> {
  key: string;
}

export type InternalCascaderProps = Omit<CascaderProps, 'onChange' | 'value' | 'defaultValue'> & {
  value?: InternalValueType;
  defaultValue?: InternalValueType;
  onChange?: (value: InternalValueType, selectOptions: BaseOptionType[] | BaseOptionType[][]) => void;
};

export type CascaderRef = Omit<BaseSelectRef, 'scrollTo'>;

const Cascader = defineComponent(
  ({
    // MISC
    id,
    prefixCls = 'rc-cascader',
    fieldNames,

    // Value
    defaultValue,
    value,
    changeOnSelect,
    onChange,
    displayRender,
    checkable,

    // Search
    showSearch,

    // Trigger
    expandTrigger,

    // Options
    options,
    popupPrefixCls,
    loadData,

    open,

    popupClassName,
    popupMenuColumnStyle,
    popupStyle: customPopupStyle,

    classNames,
    styles,

    placement,

    onPopupVisibleChange,

    // Icon
    expandIcon = '>',
    loadingIcon,

    // Children
    popupMatchSelectWidth = false,
    showCheckedStrategy = SHOW_PARENT,
    optionRender,
    ...restProps
  }: InternalCascaderProps) => {
    const slots = defineSlots();
    const mergedId = useId(id);
    const multiple = computed(() => !!checkable);

    // =========================== Values ===========================
    const [interanlRawValues, setRawValues] = useControlledState<any>(
      defaultValue,
      computed(() => value),
    );
    const rawValues = computed(() => toRawValues(interanlRawValues.value));

    // ========================= FieldNames =========================
    const mergedFieldNames = computed(() => fillFieldNames(fieldNames));

    // =========================== Option ===========================
    const [mergedOptions, getPathKeyEntities, getValueByKeyPath] = useOptions(
      mergedFieldNames,
      computed(() => options),
    );

    // =========================== Search ===========================
    const {
      searchValue,
      autoClearSearchValue = true,
      matchInputWidth = true,
      onSearch,
      filter,
      render,
      sort,
      limit = 50,
    } = $(reactiveComputed(() => (typeof showSearch === 'boolean' && showSearch === true ? {} : showSearch || {})));

    const [internalSearchValue, setSearchValue] = useControlledState(
      '',
      computed(() => searchValue),
    );
    const mergedSearchValue = computed(() => internalSearchValue.value || '');

    const onInternalSearch: BaseSelectProps['onSearch'] = (searchText, info) => {
      setSearchValue(searchText);
      if (info.source !== 'blur' && onSearch) {
        onSearch(searchText);
      }
    };

    const searchOptions = useSearchOptions(
      mergedSearchValue,
      mergedOptions,
      mergedFieldNames,
      computed(() => popupPrefixCls || prefixCls),
      reactiveComputed(() => ({
        filter,
        sort,
        limit,
        render,
      })),
      computed(() => changeOnSelect || multiple.value),
    );

    // =========================== Values ===========================
    const getMissingValues = computed(() => useMissingValues(mergedOptions.value, mergedFieldNames.value));

    // Fill `rawValues` with checked conduction values
    const { checkedValues, halfCheckedValues, missingCheckedValues } = $(
      useValues(multiple, rawValues, getPathKeyEntities, getValueByKeyPath, getMissingValues),
    );

    const deDuplicatedValues = computed(() => {
      const checkedKeys = toPathKeys(checkedValues);
      const deduplicateKeys = formatStrategyValues(checkedKeys, getPathKeyEntities, showCheckedStrategy);

      return [...missingCheckedValues, ...getValueByKeyPath(deduplicateKeys)];
    });

    const displayValues = useDisplayValues(deDuplicatedValues, mergedOptions, mergedFieldNames, multiple, displayRender);

    // =========================== Change ===========================
    const triggerChange = (nextValues: InternalValueType) => {
      setRawValues(nextValues);

      // Save perf if no need trigger event
      if (onChange) {
        const nextRawValues = toRawValues(nextValues);

        const valueOptions = nextRawValues.map((valueCells) =>
          toPathOptions(valueCells, mergedOptions.value, mergedFieldNames.value).map((valueOpt) => valueOpt.option),
        );

        const triggerValues = multiple.value ? nextRawValues : nextRawValues[0];
        const triggerOptions = multiple.value ? valueOptions : valueOptions[0];

        onChange(triggerValues, triggerOptions);
      }
    };

    // =========================== Select ===========================
    const handleSelection = computed(() =>
      useSelect(
        multiple.value,
        triggerChange,
        checkedValues,
        halfCheckedValues,
        missingCheckedValues,
        getPathKeyEntities,
        getValueByKeyPath,
        showCheckedStrategy,
      ),
    );

    const onInternalSelect = (valuePath: SingleValueType) => {
      if (!multiple.value || autoClearSearchValue) {
        setSearchValue('');
      }

      handleSelection.value(valuePath);
    };

    // Display Value change logic
    const onDisplayValuesChange: BaseSelectProps['onDisplayValuesChange'] = (_, info) => {
      if (info.type === 'clear') {
        triggerChange([]);
        return;
      }

      // Cascader do not support `add` type. Only support `remove`
      const { valueCells } = info.values[0] as DisplayValueType & { valueCells: SingleValueType };
      onInternalSelect(valueCells);
    };

    const onInternalPopupVisibleChange = (nextVisible: boolean) => {
      onPopupVisibleChange?.(nextVisible);
    };

    // ========================== Warning ===========================
    if (process.env.NODE_ENV !== 'production') {
      warningNullOptions(mergedOptions.value, mergedFieldNames.value);
    }

    // ========================== Context ===========================
    const cascaderContext = computed(() => ({
      classNames,
      styles,
      options: mergedOptions.value,
      fieldNames: mergedFieldNames.value,
      values: checkedValues,
      halfValues: halfCheckedValues,
      changeOnSelect,
      onSelect: onInternalSelect,
      checkable,
      searchOptions: searchOptions.value,
      popupPrefixCls,
      loadData,
      expandTrigger,
      expandIcon,
      loadingIcon,
      popupMenuColumnStyle,
      optionRender,
    }));

    // ==============================================================
    // ==                          Render                          ==
    // ==============================================================
    const emptyOptions = computed(() => !(mergedSearchValue.value ? searchOptions.value : mergedOptions.value).length);

    const popupStyle = computed<CSSProperties>(() => {
      return (mergedSearchValue.value && matchInputWidth) ||
        // Empty keep the width
        emptyOptions.value
        ? {}
        : {
            minWidth: 'auto',
          };
    });

    const vm = getCurrentInstance();
    const changeRef = (el) => {
      vm.exposed = el || {};
      vm.exposeProxy = el || {};
    };
    return () => (
      <CascaderContextProvider value={cascaderContext.value}>
        <BaseSelect
          {...restProps}
          // MISC
          ref={changeRef}
          id={mergedId.value}
          prefixCls={prefixCls}
          autoClearSearchValue={autoClearSearchValue}
          popupMatchSelectWidth={popupMatchSelectWidth}
          classNames={classNames}
          styles={styles}
          popupStyle={{
            ...popupStyle.value,
            ...customPopupStyle,
          }}
          // Value
          displayValues={displayValues.value}
          onDisplayValuesChange={onDisplayValuesChange}
          mode={multiple.value ? 'multiple' : undefined}
          // Search
          searchValue={mergedSearchValue.value}
          onSearch={onInternalSearch}
          showSearch={(typeof showSearch === 'boolean' && showSearch === true) || !isEmpty(showSearch)}
          // Options
          OptionList={OptionList}
          emptyOptions={emptyOptions.value}
          // Open
          open={open}
          popupClassName={popupClassName}
          placement={placement}
          onPopupVisibleChange={onInternalPopupVisibleChange}
          // Children
          getRawInputElement={() => filterEmpty(slots?.default?.())?.[0]}
        />
      </CascaderContextProvider>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' && 'Cascader' },
);

export default Cascader;
