import Render from '@vc-com/render';
import pickAttrs from '@vc-com/util/lib/pickAttrs';
import type { Key } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { computed, defineComponent, watch } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import type { DefaultOptionType, SingleValueType } from '../Cascader';
import { useCascaderContextInject } from '../context';
import { SEARCH_MARK } from '../hooks/useSearchOptions';
import { isLeaf, scrollIntoParentView, toPathKey } from '../utils/commonUtil';
import Checkbox from './Checkbox';

export const FIX_LABEL = '__cascader_fix_label__';

export interface ColumnProps<OptionType extends DefaultOptionType = DefaultOptionType> {
  prefixCls: string;
  multiple?: boolean;
  options: OptionType[];
  /** Current Column opened item key */
  activeValue?: Key;
  /** The value path before current column */
  prevValuePath: Key[];
  onToggleOpen: (open: boolean) => void;
  onSelect: (valuePath: SingleValueType, leaf: boolean) => void;
  onActive: (valuePath: SingleValueType) => void;
  checkedSet: Set<Key>;
  halfCheckedSet: Set<Key>;
  loadingKeys: Key[];
  isSelectable: (option: DefaultOptionType) => boolean;
  disabled?: boolean;
}

export default defineComponent(
  ({
    prefixCls,
    multiple,
    options,
    activeValue,
    prevValuePath,
    onToggleOpen,
    onSelect,
    onActive,
    checkedSet,
    halfCheckedSet,
    loadingKeys,
    isSelectable,
    disabled: propsDisabled,
  }: ColumnProps<any>) => {
    const menuPrefixCls = computed(() => `${prefixCls}-menu`);
    const menuItemPrefixCls = computed(() => `${prefixCls}-menu-item`);
    const menuRef = useRef<HTMLUListElement>(null);

    const {
      fieldNames,
      changeOnSelect,
      expandTrigger,
      expandIcon,
      loadingIcon,
      popupMenuColumnStyle,
      optionRender,
      classNames,
      styles,
    } = $(useCascaderContextInject());

    const hoverOpen = computed(() => expandTrigger === 'hover');

    const isOptionDisabled = (disabled?: boolean) => propsDisabled || disabled;

    // ============================ Option ============================
    const optionInfoList = computed(() =>
      options.map((option) => {
        const { disabled, disableCheckbox } = option;
        const searchOptions: Record<string, any>[] = option[SEARCH_MARK];
        const label = option[FIX_LABEL] ?? option[fieldNames.label];
        const value = option[fieldNames.value];

        const isMergedLeaf = isLeaf(option, fieldNames);

        // Get real value of option. Search option is different way.
        const fullPath = searchOptions ? searchOptions.map((opt) => opt[fieldNames.value]) : [...prevValuePath, value];
        const fullPathKey = toPathKey(fullPath);

        const isLoading = loadingKeys.includes(fullPathKey);

        // >>>>> checked
        const checked = checkedSet.has(fullPathKey);

        // >>>>> halfChecked
        const halfChecked = halfCheckedSet.has(fullPathKey);

        return {
          disabled,
          label,
          value,
          isLeaf: isMergedLeaf,
          isLoading,
          checked,
          halfChecked,
          option,
          disableCheckbox,
          fullPath,
          fullPathKey,
        };
      }),
    );

    watch(
      [() => activeValue, menuItemPrefixCls],
      () => {
        if (menuRef.value) {
          const selector = `.${menuItemPrefixCls.value}-active`;
          const activeElement = menuRef.value.querySelector<HTMLElement>(selector);

          if (activeElement) {
            scrollIntoParentView(activeElement);
          }
        }
      },
      { immediate: true },
    );

    // ============================ Render ============================
    return () => (
      <ul class={clsx(menuPrefixCls.value, classNames?.popup?.list)} style={styles?.popup?.list} ref={menuRef} role="menu">
        {optionInfoList.value.map(
          ({
            disabled,
            label,
            value,
            isLeaf: isMergedLeaf,
            isLoading,
            checked,
            halfChecked,
            option,
            fullPath,
            fullPathKey,
            disableCheckbox,
          }) => {
            const ariaProps = pickAttrs(option, { aria: true, data: true });
            // >>>>> Open
            const triggerOpenPath = () => {
              if (isOptionDisabled(disabled)) {
                return;
              }
              const nextValueCells = [...fullPath];
              if (hoverOpen.value && isMergedLeaf) {
                nextValueCells.pop();
              }
              onActive(nextValueCells);
            };

            // >>>>> Selection
            const triggerSelect = () => {
              if (isSelectable(option) && !isOptionDisabled(disabled)) {
                onSelect(fullPath, isMergedLeaf);
              }
            };

            // >>>>> Title
            let title: string | undefined;
            if (typeof option.title === 'string') {
              title = option.title;
            } else if (typeof label === 'string') {
              title = label;
            }

            // >>>>> Render
            return (
              <li
                key={fullPathKey}
                {...ariaProps}
                class={clsx(menuItemPrefixCls.value, classNames?.popup?.listItem, {
                  [`${menuItemPrefixCls.value}-expand`]: !isMergedLeaf,
                  [`${menuItemPrefixCls.value}-active`]: activeValue === value || activeValue === fullPathKey,
                  [`${menuItemPrefixCls.value}-disabled`]: isOptionDisabled(disabled),
                  [`${menuItemPrefixCls.value}-loading`]: isLoading,
                })}
                style={{ ...popupMenuColumnStyle, ...styles?.popup?.listItem }}
                role="menuitemcheckbox"
                title={title}
                aria-checked={checked}
                data-path-key={fullPathKey}
                onClick={() => {
                  triggerOpenPath();
                  if (disableCheckbox) {
                    return;
                  }
                  if (!multiple || isMergedLeaf) {
                    triggerSelect();
                  }
                }}
                onDblclick={() => {
                  if (changeOnSelect) {
                    onToggleOpen(false);
                  }
                }}
                onMouseenter={() => {
                  if (hoverOpen.value) {
                    triggerOpenPath();
                  }
                }}
                onMousedown={(e) => {
                  // Prevent selector from blurring
                  e.preventDefault();
                }}
              >
                <Checkbox
                  v-if={multiple}
                  prefixCls={`${prefixCls}-checkbox`}
                  checked={checked}
                  halfChecked={halfChecked}
                  disabled={isOptionDisabled(disabled) || disableCheckbox}
                  disableCheckbox={disableCheckbox}
                  onClick={(e) => {
                    if (disableCheckbox) {
                      return;
                    }
                    e.stopPropagation();
                    triggerSelect();
                  }}
                />
                <div class={`${menuItemPrefixCls.value}-content`}>
                  {optionRender && value !== '__EMPTY__' ? optionRender(option) : <Render content={label}></Render>}
                </div>
                {/** @ts-ignore */}
                <div v-if={!isLoading && expandIcon && !isMergedLeaf} class={`${menuItemPrefixCls.value}-expand-icon`}>
                  <Render content={expandIcon}></Render>
                </div>
                <div v-if={isLoading && loadingIcon} class={`${menuItemPrefixCls.value}-loading-icon`}>
                  <Render content={loadingIcon}></Render>
                </div>
              </li>
            );
          },
        )}
      </ul>
    );
  },
  { inheritAttrs: false },
);
