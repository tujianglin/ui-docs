// oxlint-disable no-unused-vars
import { getDOM } from '@vc-com/util/lib/Dom/findDOMNode';
import { omit } from '@vc-com/util/lib/index';
import KeyCode from '@vc-com/util/lib/KeyCode';
import pickAttrs from '@vc-com/util/lib/pickAttrs';
import { composeRef } from '@vc-com/util/lib/ref';
import type { RenderNode } from '@vc-com/util/lib/types';
import { resolveToElement, resolveVNode } from '@vc-com/util/lib/vnode';
import { clsx } from 'clsx';
import { cloneVNode, computed, defineComponent, isVNode, toRefs } from 'vue';
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
    const { triggerOpen, toggleOpen, showSearch, disabled, loading, classNames, styles } = toRefs(useBaseSelectContextInject());

    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle keyboard events similar to original Selector
    const onInternalInputKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { which } = event;

      // Compatible with multiple lines in TextArea
      const isTextAreaElement = inputRef.value instanceof HTMLTextAreaElement;

      // Prevent default behavior for up/down arrows when dropdown is open
      if (!isTextAreaElement && triggerOpen?.value && (which === KeyCode.UP || which === KeyCode.DOWN)) {
        event.preventDefault();
      }

      // Call the original onInputKeyDown callback
      if (onInputKeyDown) {
        onInputKeyDown(event);
      }

      // Move within the text box for TextArea
      if (isTextAreaElement && !triggerOpen?.value && ~[KeyCode.UP, KeyCode.DOWN, KeyCode.LEFT, KeyCode.RIGHT].indexOf(which)) {
        return;
      }

      // Open dropdown when a valid open key is pressed
      const isModifier = event.ctrlKey || event.altKey || event.metaKey;
      if (!isModifier && isValidateOpenKey(which)) {
        toggleOpen?.value?.(true);
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
        return rootRef.value;
      },
    });

    // ====================== Open ======================
    const onInternalMouseDown: SelectInputProps['onMousedown'] = (event) => {
      if (!disabled?.value) {
        const inputDOM = getDOM(inputRef.value);
        // https://github.com/ant-design/ant-design/issues/56002
        // Tell `useSelectTriggerControl` to ignore this event
        // When icon is dynamic render, the parentNode will miss
        // so we need to mark the event directly
        (event as any)!._ori_target = inputDOM;

        if (inputDOM && event.target !== inputDOM && !inputDOM.contains(event.target as Node)) {
          event.preventDefault();
        }

        // Check if we should prevent closing when clicking on selector
        // Don't close if: open && not multiple && (combobox mode || showSearch)
        const shouldPreventClose = triggerOpen?.value && !multiple && (mode === 'combobox' || showSearch?.value);

        if (!(event as any)._select_lazy) {
          inputRef.value?.focus();

          // Only toggle open if we should not prevent close
          if (!shouldPreventClose) {
            toggleOpen?.value?.();
          }
        } else if (triggerOpen?.value) {
          // Lazy should also close when click clear icon
          toggleOpen?.value?.(false);
        }
      }

      onMousedown?.(event);
    };

    // =================== Components ===================
    const RootComponent = computed(() => components?.root);

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
      if (RootComponent.value) {
        if (isVNode(RootComponent.value)) {
          return cloneVNode(RootComponent.value, {
            ...domProps.value,
            ref: composeRef(RootComponent.value.ref, rootRef),
          });
        }

        return <RootComponent.value {...domProps.value} ref={rootRef} />;
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
            <Affix class={clsx(`${prefixCls}-prefix`, classNames?.value?.prefix)} style={styles?.value?.prefix}>
              {resolveVNode(prefix)}
            </Affix>

            {/* Content */}
            <SelectContent ref={(el) => (inputRef.value = resolveToElement(el))} />

            {/* Suffix */}
            <Affix
              class={clsx(
                `${prefixCls}-suffix`,
                {
                  [`${prefixCls}-suffix-loading`]: loading.value,
                },
                classNames?.value?.suffix,
              )}
              style={styles?.value?.suffix}
            >
              {resolveVNode(suffix)}
            </Affix>
            {/* Clear Icon */}
            <Affix
              v-if={clearIcon}
              class={clsx(`${prefixCls}-clear`, classNames?.value?.clear)}
              style={styles?.value?.clear}
              onMousedown={(e) => {
                // Mark to tell not trigger open or focus
                (e as any)._select_lazy = true;
                onClearMouseDown?.(e);
              }}
            >
              {resolveVNode(clearIcon)}
            </Affix>
            <slot></slot>
          </div>
        </SelectInputContextProvider>
      );
    };
  },
  { inheritAttrs: false },
);
