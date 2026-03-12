import { clsx } from 'clsx';
import { computed, defineComponent } from 'vue';
import useControlledState from '../../util/src/hooks/useControlledState';
import type { RenderNode } from '../../util/src/types';
import type { CascaderProps, DefaultOptionType, InternalValueType, SingleValueType } from './Cascader';
import { CascaderContextProvider, type CascaderContextProps } from './context';
import useMissingValues from './hooks/useMissingValues';
import useOptions from './hooks/useOptions';
import useSelect from './hooks/useSelect';
import useValues from './hooks/useValues';
import RawOptionList from './OptionList/List';
import { fillFieldNames, toRawValues } from './utils/commonUtil';
import { toPathOptions } from './utils/treeUtil';

export type PickType =
  | 'value'
  | 'defaultValue'
  | 'changeOnSelect'
  | 'onChange'
  | 'options'
  | 'prefixCls'
  | 'checkable'
  | 'fieldNames'
  | 'showCheckedStrategy'
  | 'loadData'
  | 'expandTrigger'
  | 'expandIcon'
  | 'loadingIcon'
  | 'class'
  | 'style'
  | 'direction'
  | 'notFoundContent'
  | 'disabled'
  | 'optionRender';

export type PanelProps<
  OptionType extends DefaultOptionType = DefaultOptionType,
  ValueField extends keyof OptionType = keyof OptionType,
  Multiple extends boolean | RenderNode = false,
> = Pick<CascaderProps<OptionType, ValueField, Multiple>, PickType>;

function noop() {}

export default defineComponent(
  ({
    prefixCls = 'rc-cascader',
    style,
    class: className,
    options,
    checkable,
    defaultValue,
    value,
    fieldNames,
    changeOnSelect,
    onChange,
    showCheckedStrategy,
    loadData,
    expandTrigger,
    expandIcon = '>',
    loadingIcon,
    direction,
    notFoundContent = 'Not Found',
    disabled,
    optionRender,
  }: PanelProps) => {
    // ======================== Multiple ========================
    const multiple = computed(() => !!checkable);

    // ========================= Values =========================
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

    // ========================= Values =========================
    const getMissingValues = computed(() => useMissingValues(mergedOptions.value, mergedFieldNames.value));

    // Fill `rawValues` with checked conduction values
    const { checkedValues, halfCheckedValues, missingCheckedValues } = $(
      useValues(multiple, rawValues, getPathKeyEntities, getValueByKeyPath, getMissingValues),
    );

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

        onChange(triggerValues as any, triggerOptions);
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
      handleSelection.value(valuePath);
    };

    // ======================== Context =========================
    const cascaderContext = computed<CascaderContextProps>(() => ({
      options: mergedOptions.value,
      fieldNames: mergedFieldNames.value,
      values: checkedValues,
      halfValues: halfCheckedValues,
      changeOnSelect,
      onSelect: onInternalSelect,
      checkable,
      searchOptions: [],
      popupPrefixCls: undefined,
      loadData,
      expandTrigger,
      expandIcon,
      loadingIcon,
      popupMenuColumnStyle: undefined,
      optionRender,
    }));

    // ========================= Render =========================
    const panelPrefixCls = computed(() => `${prefixCls}-panel`);
    const isEmpty = computed(() => !mergedOptions.value.length);

    return () => (
      <CascaderContextProvider value={cascaderContext.value}>
        <div
          class={clsx(
            panelPrefixCls.value,
            { [`${panelPrefixCls.value}-rtl`]: direction === 'rtl', [`${panelPrefixCls.value}-empty`]: isEmpty.value },
            className,
          )}
          style={style}
        >
          {isEmpty ? (
            notFoundContent
          ) : (
            <RawOptionList
              prefixCls={prefixCls}
              searchValue=""
              multiple={multiple.value}
              toggleOpen={noop}
              open
              direction={direction}
              disabled={disabled}
            />
          )}
        </div>
      </CascaderContextProvider>
    );
  },
  { inheritAttrs: false },
);
