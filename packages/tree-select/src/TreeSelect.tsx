import type { BaseSelectPropsWithoutPrivate } from '@vc-com/select';
import { BaseSelect } from '@vc-com/select';
import type { BaseSelectSemanticName } from '@vc-com/select/BaseSelect';
import type { IconType } from '@vc-com/tree/interface';
import type { ExpandAction } from '@vc-com/tree/Tree';
import { conductCheck } from '@vc-com/tree/utils/conductUtil';
import useControlledState from '@vc-com/util/lib/hooks/useControlledState';
import { useId } from '@vc-com/util/lib/hooks/useId';
import type { VueNode } from '@vc-com/util/lib/types';
import { reactiveComputed } from '@vueuse/core';
import { computed, defineComponent, getCurrentInstance, type CSSProperties } from 'vue';
import { useFullProps } from 'vue-jsx-vapor';
import useCache from './hooks/useCache';
import useCheckedKeys from './hooks/useCheckedKeys';
import useDataEntities from './hooks/useDataEntities';
import useFilterTreeData from './hooks/useFilterTreeData';
import useRefFunc from './hooks/useRefFunc';
import useTreeData from './hooks/useTreeData';
import type {
  ChangeEventExtra,
  DataNode,
  DefaultValueType,
  FieldNames,
  Key,
  LabeledValueType,
  LegacyDataNode,
  SafeKey,
  SelectSource,
  SimpleModeConfig,
} from './interface';
import { LegacySelectContextProvider } from './LegacyContext';
import OptionList from './OptionList';
import { TreeSelectContextProvider, type TreeSelectContextProps } from './TreeSelectContext';
import { fillAdditionalInfo, fillLegacyProps } from './utils/legacyUtil';
import type { CheckedStrategy } from './utils/strategyUtil';
import { formatStrategyValues, SHOW_ALL, SHOW_CHILD } from './utils/strategyUtil';
import { fillFieldNames, isNil, toArray } from './utils/valueUtil';
import warningProps from './utils/warningPropsUtil';

export type SemanticName = BaseSelectSemanticName;
export type PopupSemantic = 'item' | 'itemTitle';
export interface SearchConfig {
  searchValue?: string;
  onSearch?: (value: string) => void;
  autoClearSearchValue?: boolean;
  filterTreeNode?: boolean | ((inputValue: string, treeNode: DataNode) => boolean);
  treeNodeFilterProp?: string;
}
export interface TreeSelectProps<ValueType = any, OptionType extends DataNode = DataNode> extends Omit<
  BaseSelectPropsWithoutPrivate,
  'mode' | 'classNames' | 'styles' | 'showSearch'
> {
  prefixCls?: string;
  id?: string;
  styles?: Partial<Record<SemanticName, CSSProperties>> & {
    popup?: Partial<Record<PopupSemantic, CSSProperties>>;
  };
  classNames?: Partial<Record<SemanticName, string>> & {
    popup?: Partial<Record<PopupSemantic, string>>;
  };
  // >>> Value
  value?: ValueType;
  defaultValue?: ValueType;
  onChange?: (value: ValueType, labelList: VueNode[], extra: ChangeEventExtra) => void;

  // >>> Search
  showSearch?: boolean | SearchConfig;

  // >>> Select
  onSelect?: (value: ValueType, option: OptionType) => void;
  onDeselect?: (value: ValueType, option: OptionType) => void;

  // >>> Selector
  showCheckedStrategy?: CheckedStrategy;
  treeNodeLabelProp?: string;

  // >>> Field Names
  fieldNames?: FieldNames;

  // >>> Mode
  multiple?: boolean;
  treeCheckable?: boolean | VueNode;
  treeCheckStrictly?: boolean;
  labelInValue?: boolean;
  maxCount?: number;

  // >>> Data
  treeData?: OptionType[];
  treeDataSimpleMode?: boolean | SimpleModeConfig;
  loadData?: (dataNode: LegacyDataNode) => Promise<unknown>;
  treeLoadedKeys?: SafeKey[];
  onTreeLoad?: (loadedKeys: SafeKey[]) => void;

  // >>> Expanded
  treeDefaultExpandAll?: boolean;
  treeExpandedKeys?: SafeKey[];
  treeDefaultExpandedKeys?: SafeKey[];
  onTreeExpand?: (expandedKeys: SafeKey[]) => void;
  treeExpandAction?: ExpandAction;

  // >>> Options
  virtual?: boolean;
  listHeight?: number;
  listItemHeight?: number;
  listItemScrollOffset?: number;
  onPopupVisibleChange?: (open: boolean) => void;
  treeTitleRender?: (node: OptionType) => VueNode;

  // >>> Tree
  treeLine?: boolean;
  treeIcon?: IconType;
  showTreeIcon?: boolean;
  switcherIcon?: IconType;
  treeMotion?: any;
}

function isRawValue(value: SafeKey | LabeledValueType): value is SafeKey {
  return !value || typeof value !== 'object';
}

const TreeSelect = defineComponent(
  ({
    id,
    prefixCls = 'rc-tree-select',

    // Value
    value,
    defaultValue,
    onChange,
    onSelect,
    onDeselect,

    // Search
    showSearch,
    // Selector
    showCheckedStrategy,
    treeNodeLabelProp,

    //  Mode
    multiple,
    treeCheckable,
    treeCheckStrictly,
    labelInValue,
    maxCount,

    // FieldNames
    fieldNames,

    // Data
    treeDataSimpleMode,
    treeData,
    loadData,
    treeLoadedKeys,
    onTreeLoad,

    // Expanded
    treeDefaultExpandAll,
    treeExpandedKeys,
    treeDefaultExpandedKeys,
    onTreeExpand,
    treeExpandAction,

    // Options
    virtual,
    listHeight = 200,
    listItemHeight = 20,
    listItemScrollOffset = 0,

    onPopupVisibleChange,
    popupMatchSelectWidth = true,

    // Tree
    treeLine,
    treeIcon,
    showTreeIcon,
    switcherIcon,
    treeMotion,
    treeTitleRender,

    onPopupScroll,

    classNames: treeSelectClassNames,
    styles,
    ...restProps
  }: TreeSelectProps) => {
    const props = useFullProps() as TreeSelectProps;
    const mergedId = useId(id);
    const treeConduction = computed(() => treeCheckable && !treeCheckStrictly);
    const mergedCheckable = computed(() => treeCheckable || treeCheckStrictly);
    const mergedLabelInValue = computed(() => treeCheckStrictly || labelInValue);
    const mergedMultiple = computed(() => mergedCheckable.value || multiple);

    const {
      searchValue,
      onSearch,
      autoClearSearchValue = true,
      filterTreeNode,
      treeNodeFilterProp = 'value',
    } = $(reactiveComputed(() => (typeof showSearch === 'boolean' && showSearch === true ? {} : showSearch || {})));

    const [internalValue, setInternalValue] = useControlledState(
      defaultValue,
      computed(() => value),
    );
    // `multiple` && `!treeCheckable` should be show all
    const mergedShowCheckedStrategy = computed(() => {
      if (!treeCheckable) {
        return SHOW_ALL;
      }

      return showCheckedStrategy || SHOW_CHILD;
    });

    // ========================== Warning ===========================
    if (process.env.NODE_ENV !== 'production') {
      warningProps(props);
    }

    // ========================= FieldNames =========================
    const mergedFieldNames = computed<FieldNames>(() => fillFieldNames(fieldNames));

    // =========================== Search ===========================
    const [internalSearchValue, setSearchValue] = useControlledState(
      '',
      computed(() => searchValue),
    );
    const mergedSearchValue = computed(() => internalSearchValue.value || '');

    const onInternalSearch = (searchText) => {
      setSearchValue(searchText);
      onSearch?.(searchText);
    };

    // ============================ Data ============================
    // `useTreeData` only do convert of `children` or `simpleMode`.
    // Else will return origin `treeData` for perf consideration.
    // Do not do anything to loop the data.
    const mergedTreeData = useTreeData(
      computed(() => treeData),
      computed(() => treeDataSimpleMode),
    );

    const { keyEntities, valueEntities } = $(useDataEntities(mergedTreeData, mergedFieldNames));

    /** Get `missingRawValues` which not exist in the tree yet */
    const splitRawValues = (newRawValues: SafeKey[]) => {
      const missingRawValues = [];
      const existRawValues = [];

      // Keep missing value in the cache
      newRawValues.forEach((val) => {
        if (valueEntities.has(val)) {
          existRawValues.push(val);
        } else {
          missingRawValues.push(val);
        }
      });

      return { missingRawValues, existRawValues };
    };

    // Filtered Tree
    const filteredTreeData = useFilterTreeData(
      mergedTreeData,
      mergedSearchValue,
      reactiveComputed(() => ({
        fieldNames: mergedFieldNames.value,
        treeNodeFilterProp: treeNodeFilterProp,
        filterTreeNode: filterTreeNode,
      })),
    );

    // =========================== Label ============================
    const getLabel = (item: DataNode) => {
      if (item) {
        if (treeNodeLabelProp) {
          return item[treeNodeLabelProp];
        }

        // Loop from fieldNames
        const { _title: titleList } = mergedFieldNames.value;

        for (let i = 0; i < titleList.length; i += 1) {
          const title = item[titleList[i]];
          if (title !== undefined) {
            return title;
          }
        }
      }
    };

    // ========================= Wrap Value =========================
    const toLabeledValues = (draftValues: DefaultValueType) => {
      const values = toArray(draftValues);

      return values.map((val) => {
        if (isRawValue(val)) {
          return { value: val };
        }
        return val;
      });
    };

    const convert2LabelValues = (draftValues: DefaultValueType) => {
      const values = toLabeledValues(draftValues);

      return values.map((item) => {
        let { label: rawLabel } = item;
        const { value: rawValue, halfChecked: rawHalfChecked } = item;

        let rawDisabled: boolean | undefined;

        const entity = valueEntities.get(rawValue);

        // Fill missing label & status
        if (entity) {
          // @ts-ignore
          rawLabel = treeTitleRender ? treeTitleRender(entity.node) : (rawLabel ?? getLabel(entity.node));
          rawDisabled = entity.node.disabled;
        } else if (rawLabel === undefined) {
          // We try to find in current `labelInValue` value
          const labelInValueItem = toLabeledValues(internalValue.value).find((labeledItem) => labeledItem.value === rawValue);
          rawLabel = labelInValueItem.label;
        }
        return {
          label: rawLabel,
          value: rawValue,
          halfChecked: rawHalfChecked,
          disabled: rawDisabled,
        };
      });
    };

    // =========================== Values ===========================
    const rawMixedLabeledValues = computed(() => toLabeledValues(internalValue.value === null ? [] : internalValue.value));

    // Split value into full check and half check
    const { rawLabeledValues, rawHalfLabeledValues } = $(
      reactiveComputed(() => {
        const fullCheckValues: LabeledValueType[] = [];
        const halfCheckValues: LabeledValueType[] = [];

        rawMixedLabeledValues.value.forEach((item) => {
          if (item.halfChecked) {
            halfCheckValues.push(item);
          } else {
            fullCheckValues.push(item);
          }
        });
        return { rawLabeledValues: fullCheckValues, rawHalfLabeledValues: halfCheckValues };
      }),
    );

    // const [mergedValues] = useCache(rawLabeledValues);
    // @ts-ignore
    const rawValues = computed(() => rawLabeledValues.map((item) => item.value));

    // Convert value to key. Will fill missed keys for conduct check.
    const { rawCheckedValues, rawHalfCheckedValues } = $(
      // @ts-ignore
      useCheckedKeys(
        computed(() => rawLabeledValues),
        computed(() => rawHalfLabeledValues),
        treeConduction,
        computed(() => keyEntities),
      ),
    );

    // Convert rawCheckedKeys to check strategy related values
    const displayValues = computed(() => {
      // Collect keys which need to show
      const displayKeys = formatStrategyValues(
        rawCheckedValues as SafeKey[],
        mergedShowCheckedStrategy.value,
        keyEntities,
        mergedFieldNames.value,
      );

      // Convert to value and filled with label
      const values = displayKeys.map((key) => keyEntities[key]?.node?.[mergedFieldNames.value.value] ?? key);

      // Back fill with origin label
      const labeledValues = values.map((val) => {
        const targetItem = rawLabeledValues.find((item) => item.value === val);
        const label = labelInValue ? targetItem?.label : treeTitleRender?.(targetItem);
        return {
          value: val,
          label,
        };
      });

      const rawDisplayValues = convert2LabelValues(labeledValues);

      const firstVal = rawDisplayValues[0];

      if (!mergedMultiple.value && firstVal && isNil(firstVal.value) && isNil(firstVal.label)) {
        return [];
      }

      return rawDisplayValues.map((item) => ({
        ...item,
        label: item.label ?? item.value,
      }));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    });

    const cachedDisplayValues = useCache(displayValues);

    // ========================== MaxCount ==========================
    const mergedMaxCount = computed(() => {
      if (mergedMultiple.value && (mergedShowCheckedStrategy.value === 'SHOW_CHILD' || treeCheckStrictly || !treeCheckable)) {
        return maxCount;
      }
      return null;
    });

    // =========================== Change ===========================
    const triggerChange = useRefFunc(
      (newRawValues: SafeKey[], extra: { triggerValue?: SafeKey; selected?: boolean }, source: SelectSource) => {
        const formattedKeyList = formatStrategyValues(
          newRawValues,
          mergedShowCheckedStrategy.value,
          keyEntities,
          mergedFieldNames.value,
        );

        // Not allow pass with `maxCount`
        if (mergedMaxCount.value && formattedKeyList.length > mergedMaxCount.value) {
          return;
        }

        const labeledValues = convert2LabelValues(newRawValues);
        setInternalValue(labeledValues);

        // Clean up if needed
        if (autoClearSearchValue) {
          setSearchValue('');
        }

        // Generate rest parameters is costly, so only do it when necessary
        if (onChange) {
          let eventValues: SafeKey[] = newRawValues;
          if (treeConduction.value) {
            eventValues = formattedKeyList.map((key) => {
              const entity = valueEntities.get(key);
              return entity ? entity.node[mergedFieldNames.value.value] : key;
            });
          }

          const { triggerValue, selected } = extra || {
            triggerValue: undefined,
            selected: undefined,
          };

          let returnRawValues: (LabeledValueType | SafeKey)[] = eventValues;

          // We need fill half check back
          if (treeCheckStrictly) {
            const halfValues = rawHalfLabeledValues.filter((item) => !eventValues.includes(item.value));

            returnRawValues = [...returnRawValues, ...halfValues];
          }

          const returnLabeledValues = convert2LabelValues(returnRawValues);
          const additionalInfo = {
            // [Legacy] Always return as array contains label & value
            preValue: rawLabeledValues,
            triggerValue,
          } as ChangeEventExtra;

          // [Legacy] Fill legacy data if user query.
          // This is expansive that we only fill when user query
          // https://github.com/react-component/tree-select/blob/fe33eb7c27830c9ac70cd1fdb1ebbe7bc679c16a/src/Select.jsx
          let showPosition = true;
          if (treeCheckStrictly || (source === 'selection' && !selected)) {
            showPosition = false;
          }

          fillAdditionalInfo(
            additionalInfo,
            triggerValue,
            newRawValues,
            mergedTreeData.value,
            showPosition,
            mergedFieldNames.value,
          );

          const returnValues = mergedLabelInValue.value ? returnLabeledValues : returnLabeledValues.map((item) => item.value);

          onChange(
            mergedMultiple.value ? returnValues : returnValues[0],
            mergedLabelInValue.value ? null : returnLabeledValues.map((item) => item.label),
            additionalInfo,
          );
        }
      },
    );

    // ========================== Options ===========================
    /** Trigger by option list */
    const onOptionSelect = (selectedKey: SafeKey, { selected, source }: { selected?: boolean; source?: SelectSource }) => {
      const entity = keyEntities[selectedKey];
      const node = entity?.node;
      const selectedValue = node?.[mergedFieldNames.value.value] ?? selectedKey;

      // Never be falsy but keep it safe
      if (!mergedMultiple.value) {
        // Single mode always set value
        triggerChange([selectedValue], { selected: true, triggerValue: selectedValue }, 'option');
      } else {
        let newRawValues = selected ? [...rawValues.value, selectedValue] : rawCheckedValues.filter((v) => v !== selectedValue);

        // Add keys if tree conduction
        if (treeConduction.value) {
          // Should keep missing values
          const { missingRawValues, existRawValues } = splitRawValues(newRawValues);
          const keyList = existRawValues.map((val) => valueEntities.get(val).key);

          // Conduction by selected or not
          let checkedKeys: Key[];
          if (selected) {
            ({ checkedKeys } = conductCheck(keyList, true, keyEntities));
          } else {
            ({ checkedKeys } = conductCheck(keyList, { checked: false, halfCheckedKeys: rawHalfCheckedValues }, keyEntities));
          }

          // Fill back of keys
          newRawValues = [
            ...missingRawValues,
            ...checkedKeys.map((key) => keyEntities[key as SafeKey].node[mergedFieldNames.value.value]),
          ];
        }
        triggerChange(newRawValues, { selected, triggerValue: selectedValue }, source || 'option');
      }

      // Trigger select event
      if (selected || !mergedMultiple.value) {
        onSelect?.(selectedValue, fillLegacyProps(node));
      } else {
        onDeselect?.(selectedValue, fillLegacyProps(node));
      }
    };

    // ========================== Dropdown ==========================
    const onInternalPopupVisibleChange = (open: boolean) => {
      if (onPopupVisibleChange) {
        onPopupVisibleChange(open);
      }
    };

    // ====================== Display Change ========================
    const onDisplayValuesChange = useRefFunc((newValues, info) => {
      const newRawValues = newValues.map((item) => item.value);

      if (info.type === 'clear') {
        triggerChange(newRawValues, {}, 'selection');
        return;
      }

      // TreeSelect only have multiple mode which means display change only has remove
      if (info.values.length) {
        onOptionSelect(info.values[0].value, { selected: false, source: 'selection' });
      }
    });

    // ========================== Context ===========================
    const treeSelectContext = computed(() => {
      return {
        virtual,
        popupMatchSelectWidth,
        listHeight,
        listItemHeight,
        listItemScrollOffset,
        treeData: filteredTreeData.value,
        fieldNames: mergedFieldNames.value,
        onSelect: onOptionSelect,
        treeExpandAction,
        treeTitleRender,
        onPopupScroll,
        leftMaxCount: maxCount === undefined ? null : maxCount - cachedDisplayValues.value.length,
        leafCountOnly: mergedShowCheckedStrategy.value === 'SHOW_CHILD' && !treeCheckStrictly && !!treeCheckable,
        valueEntities,
        classNames: treeSelectClassNames,
        styles,
      } as TreeSelectContextProps;
    });

    // ======================= Legacy Context =======================
    const legacyContext = computed(() => ({
      checkable: mergedCheckable.value,
      loadData,
      treeLoadedKeys,
      onTreeLoad,
      checkedKeys: rawCheckedValues,
      halfCheckedKeys: rawHalfCheckedValues,
      treeDefaultExpandAll,
      treeExpandedKeys,
      treeDefaultExpandedKeys,
      onTreeExpand,
      treeIcon,
      treeMotion,
      showTreeIcon,
      switcherIcon,
      treeLine,
      treeNodeFilterProp,
      keyEntities,
    }));

    const vm = getCurrentInstance();
    const changeRef = (el) => {
      vm.exposed = el || {};
      vm.exposeProxy = el || {};
    };

    // =========================== Render ===========================
    return () => (
      <TreeSelectContextProvider value={treeSelectContext.value}>
        <LegacySelectContextProvider value={legacyContext.value}>
          <BaseSelect
            ref={changeRef}
            {...restProps}
            classNames={treeSelectClassNames}
            styles={styles}
            // >>> MISC
            id={mergedId.value}
            prefixCls={prefixCls}
            mode={mergedMultiple.value ? 'multiple' : undefined}
            // >>> Display Value
            displayValues={cachedDisplayValues.value}
            onDisplayValuesChange={onDisplayValuesChange}
            // >>> Search
            autoClearSearchValue={autoClearSearchValue}
            showSearch={showSearch as boolean}
            searchValue={mergedSearchValue.value}
            onSearch={onInternalSearch}
            // >>> Options
            OptionList={OptionList}
            emptyOptions={!mergedTreeData.value.length}
            onPopupVisibleChange={onInternalPopupVisibleChange}
            popupMatchSelectWidth={popupMatchSelectWidth}
          />
        </LegacySelectContextProvider>
      </TreeSelectContextProvider>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'TreeSelect' : '' },
);

export default TreeSelect;
