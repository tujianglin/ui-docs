import KeyCode from '@vc-com/util/lib/KeyCode';
import useMemo from '@vc-com/util/lib/hooks/useMemo';
import omit from '@vc-com/util/lib/omit';
import pickAttrs from '@vc-com/util/lib/pickAttrs';
import { resolveVNode } from '@vc-com/util/lib/vnode';
import type { ListRef, ScrollConfig } from '@vc-com/virtual-list';
import List from '@vc-com/virtual-list';
import { clsx } from 'clsx';
import { computed, defineComponent, isVNode, ref, watch } from 'vue';
import { useRef, type KeyboardEventHandler, type MouseEventHandler } from 'vue-jsx-vapor';
import type { BaseOptionType, RawValueType } from './Select';
import { useSelectContextInject } from './SelectContext';
import TransBtn from './TransBtn';
import { useBaseSelectContextInject } from './hooks/useBaseProps';
import type { FlattenOptionData } from './interface';
import { isPlatformMac } from './utils/platformUtil';
import { isValidCount } from './utils/valueUtil';

// export interface OptionListProps<OptionsType extends object[]> {
export type OptionListProps = Record<string, never>;

export interface RefOptionListProps {
  onKeyDown: KeyboardEventHandler;
  onKeyUp: KeyboardEventHandler;
  scrollTo?: (args: number | ScrollConfig) => void;
}

function isTitleType(content: any) {
  return typeof content === 'string' || typeof content === 'number';
}

/**
 * Using virtual list of option display.
 * Will fallback to dom if use customize render.
 */
const OptionList = defineComponent(
  () => {
    const {
      prefixCls,
      id,
      open,
      multiple,
      mode,
      searchValue,
      toggleOpen,
      // @ts-ignore
      notFoundContent,
      onPopupScroll,
      showScrollBar,
      lockOptions,
    } = $(useBaseSelectContextInject());
    const {
      maxCount,
      flattenOptions,
      onActiveValue,
      defaultActiveFirstOption,
      onSelect,
      menuItemSelectedIcon,
      rawValues,
      fieldNames,
      virtual,
      direction,
      listHeight,
      listItemHeight,
      optionRender,
      classNames: contextClassNames,
      styles: contextStyles,
    } = $(useSelectContextInject());

    const itemPrefixCls = computed(() => `${prefixCls}-item`);

    const memoFlattenOptions = useMemo(
      () => flattenOptions,
      [() => open, () => lockOptions],
      (_prev, next) => next[0] && !next[1],
    );

    // =========================== List ===========================
    const listRef = useRef<ListRef>(null);

    const overMaxCount = computed<boolean>(() => multiple && isValidCount(maxCount) && rawValues?.size >= maxCount);

    const onListMouseDown: MouseEventHandler<HTMLDivElement> = (event) => {
      event.preventDefault();
    };

    const scrollIntoView = (args: number | ScrollConfig) => {
      listRef.value?.scrollTo(typeof args === 'number' ? { index: args } : args);
    };

    // https://github.com/ant-design/ant-design/issues/34975
    const isSelected = (value: RawValueType) => {
      if (mode === 'combobox') {
        return false;
      }
      return rawValues.has(value);
    };

    // ========================== Active ==========================
    const getEnabledActiveIndex = (index: number, offset: number = 1): number => {
      const len = memoFlattenOptions.length;

      for (let i = 0; i < len; i += 1) {
        const current = (index + i * offset + len) % len;

        const { group, data } = memoFlattenOptions[current] || {};

        if (!group && !data?.disabled && (isSelected(data.value) || !overMaxCount.value)) {
          return current;
        }
      }

      return -1;
    };

    const activeIndex = ref(getEnabledActiveIndex(0));
    const setActive = (index: number, fromKeyboard = false) => {
      activeIndex.value = index;

      const info = { source: fromKeyboard ? ('keyboard' as const) : ('mouse' as const) };

      // Trigger active event
      const flattenItem = memoFlattenOptions[index];
      if (!flattenItem) {
        onActiveValue(null, -1, info);
        return;
      }
      onActiveValue(flattenItem.value, index, info);
    };

    // Auto active first item when list length or searchValue changed
    watch(
      [() => memoFlattenOptions.length, () => searchValue],
      () => {
        setActive(defaultActiveFirstOption !== false ? getEnabledActiveIndex(0) : -1);
      },
      { immediate: true },
    );

    // https://github.com/ant-design/ant-design/issues/48036
    const isAriaSelected = (value: RawValueType) => {
      if (mode === 'combobox') {
        return String(value).toLowerCase() === searchValue.toLowerCase();
      }
      return rawValues.has(value);
    };

    // Auto scroll to item position in single mode
    watch([() => open, () => searchValue], () => {
      /**
       * React will skip `onChange` when component update.
       * `setActive` function will call root accessibility state update which makes re-render.
       * So we need to delay to let Input component trigger onChange first.
       */
      let timeoutId: NodeJS.Timeout;

      if (!multiple && open && rawValues.size === 1) {
        const value: RawValueType = Array.from(rawValues)[0];
        // Scroll to the option closest to the searchValue if searching.
        const index = memoFlattenOptions.findIndex(({ data }) =>
          searchValue ? String(data.value).startsWith(searchValue) : data.value === value,
        );

        if (index !== -1) {
          setActive(index);
          timeoutId = setTimeout(() => {
            scrollIntoView(index);
          });
        }
      }

      // Force trigger scrollbar visible when open
      if (open) {
        listRef.value?.scrollTo(undefined);
      }

      return () => clearTimeout(timeoutId);
    });

    // ========================== Values ==========================
    const onSelectValue = (value: RawValueType) => {
      if (value !== undefined) {
        onSelect(value, { selected: !rawValues.has(value) });
      }

      // Single mode should always close by select
      if (!multiple) {
        toggleOpen(false);
      }
    };

    // ========================= Keyboard =========================
    defineExpose({
      onKeyDown: (event) => {
        const { which, ctrlKey } = event;
        switch (which) {
          // >>> Arrow keys & ctrl + n/p on Mac
          case KeyCode.N:
          case KeyCode.P:
          case KeyCode.UP:
          case KeyCode.DOWN: {
            let offset = 0;
            if (which === KeyCode.UP) {
              offset = -1;
            } else if (which === KeyCode.DOWN) {
              offset = 1;
            } else if (isPlatformMac() && ctrlKey) {
              if (which === KeyCode.N) {
                offset = 1;
              } else if (which === KeyCode.P) {
                offset = -1;
              }
            }

            if (offset !== 0) {
              const nextActiveIndex = getEnabledActiveIndex(activeIndex.value + offset, offset);
              scrollIntoView(nextActiveIndex);
              setActive(nextActiveIndex, true);
            }

            break;
          }

          // >>> Select (Tab / Enter)
          case KeyCode.TAB:
          case KeyCode.ENTER: {
            // value
            const item = memoFlattenOptions[activeIndex.value];
            if (!item || item.data.disabled) {
              return onSelectValue(undefined);
            }

            if (!overMaxCount.value || rawValues.has(item.value)) {
              onSelectValue(item.value);
            } else {
              onSelectValue(undefined);
            }

            if (open) {
              event.preventDefault();
            }

            break;
          }

          // >>> Close
          case KeyCode.ESC: {
            toggleOpen(false);
            if (open) {
              event.stopPropagation();
            }
          }
        }
      },
      onKeyUp: () => {},

      scrollTo: (index) => {
        scrollIntoView(index);
      },
    });

    // ========================== Render ==========================
    const getLabel = (item: Record<string, any>) => item.label;

    function getItemAriaProps(item: FlattenOptionData<BaseOptionType>, index: number) {
      const { group } = item;

      return {
        role: group ? 'presentation' : 'option',
        id: `${id}_list_${index}`,
      };
    }

    const RenderItem = ({ index }: { index: number }) => {
      const item = memoFlattenOptions[index];
      if (!item) {
        return null;
      }
      const itemData = item.data || {};
      const { value } = itemData;
      const { group } = item;
      const attrs = pickAttrs(itemData, true);
      const mergedLabel = getLabel(item);
      return (
        <div
          aria-label={typeof mergedLabel === 'string' && !group ? mergedLabel : null}
          {...attrs}
          key={index}
          {...getItemAriaProps(item, index)}
          aria-selected={isAriaSelected(value)}
        >
          {value}
        </div>
      );
    };

    return () => {
      if (memoFlattenOptions.length === 0) {
        return (
          <div role="listbox" id={`${id}_list`} class={`${itemPrefixCls}-empty`} onMousedown={onListMouseDown}>
            {/* @ts-ignore */}
            {resolveVNode(notFoundContent)}
          </div>
        );
      }

      const omitFieldNameList = Object.keys(fieldNames).map((key) => fieldNames[key]);

      const a11yProps = {
        role: 'listbox',
        id: `${id}_list`,
      };

      return (
        <>
          <div v-if={virtual} {...a11yProps} style={{ height: 0, width: 0, overflow: 'hidden' }}>
            <RenderItem index={activeIndex.value - 1}></RenderItem>
            <RenderItem index={activeIndex.value}></RenderItem>
            <RenderItem index={activeIndex.value + 1}></RenderItem>
          </div>
          <List
            itemKey="key"
            ref={listRef}
            data={memoFlattenOptions}
            height={listHeight}
            itemHeight={listItemHeight}
            fullHeight={false}
            onMousedown={onListMouseDown}
            onScroll={onPopupScroll}
            virtual={virtual}
            direction={direction}
            innerProps={virtual ? null : a11yProps}
            showScrollBar={showScrollBar}
            class={contextClassNames?.popup?.list}
            style={contextStyles?.popup?.list}
          >
            {({ item, index: itemIndex }) => {
              const { group, groupOption, data, label, value } = item;
              const { key } = data;

              // Group
              if (group) {
                const groupTitle = data.title ?? (isTitleType(label) ? label.toString() : undefined);

                return (
                  <div class={clsx(itemPrefixCls.value, `${itemPrefixCls.value}-group`, data.className)} title={groupTitle}>
                    {label !== undefined ? label : key}
                  </div>
                );
              }

              const { disabled, title, style, class: className, ...otherProps } = data;
              const passedProps = omit(otherProps, omitFieldNameList);

              // Option
              const selected = isSelected(value);

              const mergedDisabled = disabled || (!selected && overMaxCount.value);

              const optionPrefixCls = `${itemPrefixCls.value}-option`;

              const optionClassName = clsx(itemPrefixCls.value, optionPrefixCls, className, contextClassNames?.popup?.listItem, {
                [`${optionPrefixCls}-grouped`]: groupOption,
                [`${optionPrefixCls}-active`]: activeIndex.value === itemIndex && !mergedDisabled,
                [`${optionPrefixCls}-disabled`]: mergedDisabled,
                [`${optionPrefixCls}-selected`]: selected,
              });

              const mergedLabel = getLabel(item);

              // @ts-ignore
              const iconVisible = !menuItemSelectedIcon || typeof menuItemSelectedIcon === 'function' || selected;

              // https://github.com/ant-design/ant-design/issues/34145
              const content = typeof mergedLabel === 'number' ? mergedLabel : mergedLabel || value;
              // https://github.com/ant-design/ant-design/issues/26717
              let optionTitle = isTitleType(content) ? content.toString() : undefined;
              if (title !== undefined) {
                optionTitle = title;
              }
              return (
                <div
                  {...pickAttrs(passedProps)}
                  {...(!virtual ? getItemAriaProps(item, itemIndex) : {})}
                  aria-selected={virtual ? undefined : isAriaSelected(value)}
                  class={optionClassName}
                  title={optionTitle}
                  onMousemove={() => {
                    if (activeIndex.value === itemIndex || mergedDisabled) {
                      return;
                    }
                    setActive(itemIndex);
                  }}
                  onClick={() => {
                    if (!mergedDisabled) {
                      onSelectValue(value);
                    }
                  }}
                  style={{ ...contextStyles?.popup?.listItem, ...style }}
                >
                  <div class={`${optionPrefixCls}-content`}>
                    {typeof optionRender === 'function' ? optionRender(item, { index: itemIndex }) : resolveVNode(content)}
                  </div>
                  {isVNode(menuItemSelectedIcon) || selected}
                  <TransBtn
                    v-if={iconVisible}
                    class={`${itemPrefixCls.value}-option-state`}
                    customizeIcon={menuItemSelectedIcon}
                    customizeIconProps={{
                      value,
                      disabled: mergedDisabled,
                      isSelected: selected,
                    }}
                  >
                    {selected ? '✓' : null}
                  </TransBtn>
                </div>
              );
            }}
          </List>
        </>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'OptionList' : undefined },
);

export default OptionList;
