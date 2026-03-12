/* eslint-disable default-case */
import type { useBaseSelectContextInject } from '@vc-com/select';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent, ref, watch } from 'vue';
import { useFullProps, useRef } from 'vue-jsx-vapor';
import Render from '../../../render/src/render';
import type { DefaultOptionType, LegacyKey, SingleValueType } from '../Cascader';
import { useCascaderContextInject } from '../context';
import { getFullPathKeys, isLeaf, scrollIntoParentView, toPathKey, toPathKeys, toPathValueStr } from '../utils/commonUtil';
import { toPathOptions } from '../utils/treeUtil';
import Column, { FIX_LABEL } from './Column';
import useActive from './useActive';
import useKeyboard from './useKeyboard';

export type RawOptionListProps = Pick<
  ReturnType<typeof useBaseSelectContextInject>,
  'prefixCls' | 'multiple' | 'searchValue' | 'toggleOpen' | 'notFoundContent' | 'direction' | 'open' | 'disabled'
> & {
  lockOptions?: boolean;
};

const RawOptionList = defineComponent(
  ({
    prefixCls,
    multiple,
    searchValue,
    toggleOpen,
    notFoundContent,
    direction,
    open,
    disabled,
    lockOptions: _ = false,
    // @ts-ignore
  }: RawOptionListProps) => {
    const props = useFullProps() as RawOptionListProps;
    const containerRef = useRef<HTMLDivElement>(null);
    const rtl = computed(() => direction === 'rtl');

    const {
      options,
      values,
      halfValues,
      fieldNames,
      changeOnSelect,
      onSelect,
      searchOptions,
      popupPrefixCls,
      loadData,
      expandTrigger,
    } = $(useCascaderContextInject());

    const mergedPrefixCls = computed(() => popupPrefixCls || prefixCls);

    // ========================= loadData =========================
    const loadingKeys = ref<LegacyKey[]>([]);

    const internalLoadData = (valueCells: LegacyKey[]) => {
      // Do not load when search
      if (!loadData || searchValue) {
        return;
      }

      const optionList = toPathOptions(valueCells, options, fieldNames);
      const rawOptions = optionList.map(({ option }) => option);
      const lastOption = rawOptions[rawOptions.length - 1];

      if (lastOption && !isLeaf(lastOption, fieldNames)) {
        const pathKey = toPathKey(valueCells);

        loadingKeys.value = [...loadingKeys.value, pathKey];

        loadData(rawOptions);
      }
    };

    // zombieJ: This is bad. We should make this same as `rc-tree` to use Promise instead.
    watch(
      [() => options, loadingKeys, () => fieldNames],
      () => {
        if (loadingKeys.value.length) {
          loadingKeys.value.forEach((loadingKey) => {
            const valueStrCells = toPathValueStr(loadingKey as string);
            const optionList = toPathOptions(valueStrCells, options, fieldNames, true).map(({ option }) => option);
            const lastOption = optionList[optionList.length - 1];

            if (!lastOption || lastOption[fieldNames.children] || isLeaf(lastOption, fieldNames)) {
              loadingKeys.value = loadingKeys.value.filter((key) => key !== loadingKey);
            }
          });
        }
      },
      { immediate: true, deep: true },
    );

    // ========================== Values ==========================
    const checkedSet = computed(() => new Set(toPathKeys(values)));
    const halfCheckedSet = computed(() => new Set(toPathKeys(halfValues)));

    // ====================== Accessibility =======================
    const activeValueCells = useActive(
      computed(() => multiple),
      computed(() => open),
    );

    // =========================== Path ===========================
    const onPathOpen = (nextValueCells: LegacyKey[]) => {
      activeValueCells.value = nextValueCells;

      // Trigger loadData
      internalLoadData(nextValueCells);
    };

    const isSelectable = (option: DefaultOptionType) => {
      if (disabled) {
        return false;
      }

      const { disabled: optionDisabled } = option;
      const isMergedLeaf = isLeaf(option, fieldNames);

      return !optionDisabled && (isMergedLeaf || changeOnSelect || multiple);
    };

    const onPathSelect = (valuePath: SingleValueType, leaf: boolean, fromKeyboard = false) => {
      onSelect(valuePath);

      if (!multiple && (leaf || (changeOnSelect && (expandTrigger === 'hover' || fromKeyboard)))) {
        toggleOpen(false);
      }
    };

    // ========================== Option ==========================
    const mergedOptions = computed(() => {
      if (searchValue) {
        return searchOptions;
      }

      return options;
    });

    // ========================== Column ==========================
    const optionColumns = computed(() => {
      const optionList = [{ options: mergedOptions.value }];
      let currentList = mergedOptions.value;

      const fullPathKeys = getFullPathKeys(currentList, fieldNames);

      for (let i = 0; i < activeValueCells.value.length; i += 1) {
        const activeValueCell = activeValueCells.value[i];
        const currentOption = currentList.find(
          (option, index) =>
            (fullPathKeys[index] ? toPathKey(fullPathKeys[index]) : option[fieldNames.value]) === activeValueCell,
        );

        const subOptions = currentOption?.[fieldNames.children];
        if (!subOptions?.length) {
          break;
        }

        currentList = subOptions;
        optionList.push({ options: subOptions });
      }

      return optionList;
    });

    // ========================= Keyboard =========================
    const onKeyboardSelect = (selectValueCells: SingleValueType, option: DefaultOptionType) => {
      if (isSelectable(option)) {
        onPathSelect(selectValueCells, isLeaf(option, fieldNames), true);
      }
    };

    const { onKeydown, onKeyup } = useKeyboard(
      mergedOptions,
      computed(() => fieldNames),
      activeValueCells,
      onPathOpen,
      onKeyboardSelect,
      reactiveComputed(() => ({
        direction,
        searchValue,
        toggleOpen,
        open,
      })),
    );

    defineExpose({
      onKeydown,
      onKeyup,
    });

    // >>>>> Active Scroll
    watch(
      [activeValueCells, () => searchValue],
      () => {
        if (searchValue) {
          return;
        }
        for (let i = 0; i < activeValueCells.value.length; i += 1) {
          const cellPath = activeValueCells.value.slice(0, i + 1);
          const cellKeyPath = toPathKey(cellPath);
          const ele = containerRef.value?.querySelector<HTMLElement>(
            `li[data-path-key="${cellKeyPath.replace(/\\{0,2}"/g, '\\"')}"]`, // matches unescaped double quotes
          );
          if (ele) {
            scrollIntoParentView(ele);
          }
        }
      },
      { immediate: true, deep: true },
    );

    // ========================== Render ==========================
    // >>>>> Empty
    const isEmpty = computed(() => !optionColumns.value[0]?.options?.length);

    const emptyList = computed<DefaultOptionType[]>(() => [
      {
        [fieldNames.value as 'value']: '__EMPTY__',
        [FIX_LABEL as 'label']: notFoundContent,
        disabled: true,
      },
    ]);

    const columnProps = computed(() => ({
      ...props,
      multiple: !isEmpty.value && multiple,
      onSelect: onPathSelect,
      onActive: onPathOpen,
      onToggleOpen: toggleOpen,
      checkedSet: checkedSet.value,
      halfCheckedSet: halfCheckedSet.value,
      loadingKeys: loadingKeys.value,
      isSelectable,
    }));

    // >>>>> Columns
    const mergedOptionColumns = computed(() => (isEmpty.value ? [{ options: emptyList.value }] : optionColumns.value));

    const columnNodes = () => {
      return mergedOptionColumns.value.map((col, index) => {
        const prevValuePath = activeValueCells.value.slice(0, index);
        const activeValue = activeValueCells.value[index];
        return (
          <Column
            key={index}
            {...columnProps.value}
            prefixCls={mergedPrefixCls.value}
            options={col.options}
            prevValuePath={prevValuePath}
            activeValue={activeValue}
          />
        );
      });
    };

    // >>>>> Render
    return () => (
      <div
        class={clsx(`${mergedPrefixCls.value}-menus`, {
          [`${mergedPrefixCls.value}-menu-empty`]: isEmpty.value,
          [`${mergedPrefixCls.value}-rtl`]: rtl.value,
        })}
        ref={containerRef}
      >
        <Render content={columnNodes}></Render>
      </div>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'RawOptionList' : undefined },
);

export default RawOptionList;
