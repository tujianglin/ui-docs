// oxlint-disable no-unused-vars
import Render from '@vc-com/render';
import { getDOM } from '@vc-com/util/lib/Dom/findDOMNode';
import { omit } from '@vc-com/util/lib/index';
import KeyCode from '@vc-com/util/lib/KeyCode';
import pickAttrs from '@vc-com/util/lib/pickAttrs';
import { composeRef } from '@vc-com/util/lib/ref';
import type { RenderNode } from '@vc-com/util/lib/types';
import { resolveToElement } from '@vc-com/util/lib/vnode';
import { clsx } from 'clsx';
import { cloneVNode, computed, defineComponent, isVNode } from 'vue';
import {
  useFullProps,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type KeyboardEventHandler,
  type MouseEventHandler,
} from 'vue-jsx-vapor';
import { useBaseSelectContextInject } from '../hooks/useBaseProps';
import type { ComponentsConfig } from '../hooks/useComponents';
import type { DisplayValueType, Mode } from '../interface';
import { isValidateOpenKey } from '../utils/keyUtil';
import Affix from './Affix';
import SelectContent from './Content';
import { SelectInputContextProvider } from './context';

export interface SelectInputRef {
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  nativeElement: HTMLDivElement;
}

export interface SelectInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'prefix' | 'placeholder'> {
  prefixCls: string;
  prefix?: RenderNode;
  suffix?: RenderNode;
  clearIcon?: RenderNode;
  removeIcon?: RenderNode;
  multiple?: boolean;
  displayValues: DisplayValueType[];
  placeholder?: RenderNode;
  searchValue?: string;
  activeValue?: string;
  mode?: Mode;
  autoClearSearchValue?: boolean;
  onSearch?: (searchText: string, fromTyping: boolean, isCompositing: boolean) => void;
  onSearchSubmit?: (searchText: string) => void;
  onInputBlur?: () => void;
  onClearMouseDown?: MouseEventHandler<HTMLElement>;
  onInputKeyDown?: KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onSelectorRemove?: (value: DisplayValueType) => void;
  maxLength?: number;
  autoFocus?: boolean;
  /** Check if `tokenSeparators` contains `\n` or `\r\n` */
  tokenWithEnter?: boolean;
  // Add other props that need to be passed through
  class?: string;
  style?: CSSProperties;
  focused?: boolean;
  components: ComponentsConfig;
}

const DEFAULT_OMIT_PROPS = [
  'value',
  'onChange',
  'removeIcon',
  'placeholder',
  'maxTagCount',
  'maxTagTextLength',
  'maxTagPlaceholder',
  'choiceTransitionName',
  'onInputKeyDown',
  'onPopupScroll',
  'tabindex',
  'activeValue',
  'onSelectorRemove',
  'focused',
] as const;

export default defineComponent(
  ({
    // Style
    prefixCls,
    class: className,
    style,

    // UI
    prefix,
    suffix,
    clearIcon,

    // Data
    multiple,
    displayValues,
    placeholder,
    mode,

    // Search
    searchValue,
    onSearch,
    onSearchSubmit,
    onInputBlur,

    // Input
    maxLength,
    autoFocus,

    // Events
    onMousedown,
    onClearMouseDown,
    onInputKeyDown,
    onSelectorRemove,

    // Token handling
    tokenWithEnter,

    // Components
    components,

    ...restProps
  }: SelectInputProps) => {
    const props = useFullProps() as unknown as SelectInputProps;
    const { triggerOpen, toggleOpen, showSearch, disabled, loading, classNames, styles } = $(useBaseSelectContextInject());

    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle keyboard events similar to original Selector
    const onInternalInputKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { which } = event;

      // Compatible with multiple lines in TextArea
      const isTextAreaElement = inputRef.value instanceof HTMLTextAreaElement;

      // Prevent default behavior for up/down arrows when dropdown is open
      if (!isTextAreaElement && triggerOpen && (which === KeyCode.UP || which === KeyCode.DOWN)) {
        event.preventDefault();
      }

      // Call the original onInputKeyDown callback
      if (onInputKeyDown) {
        onInputKeyDown(event);
      }

      // Move within the text box for TextArea
      if (isTextAreaElement && !triggerOpen && ~[KeyCode.UP, KeyCode.DOWN, KeyCode.LEFT, KeyCode.RIGHT].indexOf(which)) {
        return;
      }

      // Open dropdown when a valid open key is pressed
      const isModifier = event.ctrlKey || event.altKey || event.metaKey;
      if (!isModifier && isValidateOpenKey(which)) {
        toggleOpen?.(true);
      }
    };

    // ====================== Refs ======================
    defineExpose({
      focus: (options?: FocusOptions) => {
        // Focus the inner input if available, otherwise fall back to root div.
        (inputRef.value || rootRef.value).focus?.(options);
      },
      blur: () => {
        (inputRef.value || rootRef.value).blur?.();
      },
      get nativeElement() {
        return getDOM(rootRef.value);
      },
    });

    // ====================== Open ======================
    const onInternalMouseDown: SelectInputProps['onMousedown'] = (event) => {
      if (!disabled) {
        const inputDOM = getDOM(inputRef.value);
        // https://github.com/ant-design/ant-design/issues/56002
        // Tell `useSelectTriggerControl` to ignore this event
        // When icon is dynamic render, the parentNode will miss
        // so we need to mark the event directly
        (event as any)!._ori_target = inputDOM;

        const isClickOnInput = inputDOM === event.target || inputDOM?.contains(event.target as Node);

        if (inputDOM && !isClickOnInput) {
          event.preventDefault();
        }

        // Check if we should prevent closing when clicking on selector
        // Don't close if: open && not multiple && (combobox mode || showSearch)
        const shouldPreventCloseOnSingle = triggerOpen && !multiple && (mode === 'combobox' || showSearch);

        // Don't close if: open && multiple && click on input
        const shouldPreventCloseOnMultipleInput = triggerOpen && multiple && isClickOnInput;

        const shouldPreventClose = shouldPreventCloseOnSingle || shouldPreventCloseOnMultipleInput;

        if (!(event as any)._select_lazy) {
          inputRef.value?.focus();

          // Only toggle open if we should not prevent close
          if (!shouldPreventClose) {
            toggleOpen?.();
          }
        } else if (triggerOpen) {
          // Lazy should also close when click clear icon
          toggleOpen?.(false);
        }
      }

      onMousedown?.(event);
    };

    // ===================== Render =====================
    const domProps = computed(() => omit(restProps, DEFAULT_OMIT_PROPS as any));
    const ariaProps = computed(() => pickAttrs(domProps.value, { aria: true }));
    const ariaKeys = computed(() => Object.keys(ariaProps.value) as (keyof typeof domProps.value)[]);

    // Create context value with wrapped callbacks
    const contextValue = computed(() => ({
      ...props,
      onInputKeyDown: onInternalInputKeyDown,
    }));

    return () => {
      const RootComponent = components?.root;
      if (RootComponent) {
        const originProps = (RootComponent as any).props || {};
        const mergedProps = { ...originProps, ...domProps };

        Object.keys(originProps).forEach((key) => {
          const originVal = originProps[key];
          const domVal = domProps[key];

          if (typeof originVal === 'function' && typeof domVal === 'function') {
            mergedProps[key] = (...args: any[]) => {
              domVal(...args);
              originVal(...args);
            };
          }
        });
        if (isVNode(RootComponent)) {
          return cloneVNode(RootComponent, {
            ...mergedProps,
            ref: composeRef(RootComponent.ref, rootRef),
          });
        }

        return <RootComponent {...mergedProps} ref={rootRef} />;
      }
      return (
        <SelectInputContextProvider value={contextValue.value}>
          <div
            {...omit(domProps.value, ariaKeys.value)}
            // Style
            ref={rootRef}
            class={className}
            style={style}
            // Mouse Events
            onMousedown={onInternalMouseDown}
          >
            {/* Prefix */}
            <Affix class={clsx(`${prefixCls}-prefix`, classNames?.prefix)} style={styles?.prefix}>
              <Render content={prefix}></Render>
            </Affix>

            {/* Content */}
            <SelectContent ref={(el) => (inputRef.value = resolveToElement(el))} />

            {/* Suffix */}
            <Affix
              class={clsx(
                `${prefixCls}-suffix`,
                {
                  [`${prefixCls}-suffix-loading`]: loading,
                },
                classNames?.suffix,
              )}
              style={styles?.suffix}
            >
              <Render content={suffix}></Render>
            </Affix>
            {/* Clear Icon */}
            <Affix
              v-if={clearIcon}
              class={clsx(`${prefixCls}-clear`, classNames?.clear)}
              style={styles?.clear}
              onMousedown={(e) => {
                // Mark to tell not trigger open or focus
                (e as any)._select_lazy = true;
                onClearMouseDown?.(e);
              }}
            >
              <Render content={clearIcon}></Render>
            </Affix>
            <slot></slot>
          </div>
        </SelectInputContextProvider>
      );
    };
  },
  { inheritAttrs: false },
);
