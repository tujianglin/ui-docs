// oxlint-disable no-unused-vars
import ResizeObserver from '@vc-com/resize-observer';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent, ref, watch, type CSSProperties } from 'vue';
import { useFullProps, useRef } from 'vue-jsx-vapor';
import type { RenderNode } from '../../../../util/src/types';
import type { DateType, SelectorProps } from '../../interface';
import { usePickerContextInject } from '../context';
import useInputProps from './hooks/useInputProps';
import useRootProps from './hooks/useRootProps';
import Icon, { ClearIcon } from './Icon';
import Input, { type InputRef } from './Input';

export type SelectorIdType =
  | string
  | {
      start?: string;
      end?: string;
    };

export interface RangeSelectorProps extends SelectorProps {
  id?: SelectorIdType;

  activeIndex: number | null;

  separator?: RenderNode;

  value?: DateType[];
  onChange: (date: DateType, index?: number) => void;

  disabled: [boolean, boolean];

  /** All the field show as `placeholder` */
  allHelp: boolean;

  placeholder?: string | [string, string];

  // Invalid
  invalid: [boolean, boolean];
  placement?: string;
  // Offset
  /**
   * Trigger when the active bar offset position changed.
   * This is used for popup panel offset.
   */
  onActiveInfo: (info: [activeInputLeft: number, activeInputRight: number, selectorWidth: number]) => void;
}

const RefRangeSelector = defineComponent(
  ({
    id,

    prefix,
    clearIcon,
    suffixIcon,
    separator = '~',
    activeIndex,
    activeHelp,
    allHelp,

    focused,
    onFocus,
    onBlur,
    onKeydown,
    locale,
    generateConfig,

    // Placeholder
    placeholder,

    // Style
    class: className,
    style,

    // Click
    onClick,
    onClear,

    // Change
    value,
    onChange,
    onSubmit,
    onInputChange,

    // Valid
    format,
    maskFormat,
    preserveInvalidOnBlur,
    onInvalid,

    // Disabled
    disabled,
    invalid,
    inputReadOnly,

    // Direction
    direction,

    // Open
    onOpenChange,

    // Offset
    onActiveInfo,
    placement,

    // Native
    onMousedown,

    // Input
    required,
    'aria-required': ariaRequired,
    autofocus,
    tabindex,

    ...restProps
  }: RangeSelectorProps) => {
    const props = useFullProps() as RangeSelectorProps;
    const rtl = computed(() => direction === 'rtl');

    // ======================== Prefix ========================
    const { prefixCls, classNames, styles } = $(usePickerContextInject());

    // ========================== Id ==========================
    const ids = computed(() => {
      if (typeof id === 'string') {
        return [id];
      }

      const mergedId = id || {};

      return [mergedId.start, mergedId.end];
    });

    // ========================= Refs =========================
    const rootRef = useRef<HTMLDivElement>();
    const inputStartRef = useRef<InputRef>();
    const inputEndRef = useRef<InputRef>();

    const getInput = (index: number) => [inputStartRef, inputEndRef][index]?.value;

    defineExpose({
      get nativeElement() {
        return rootRef.value;
      },
      focus: (options) => {
        if (typeof options === 'object') {
          const { index = 0, ...rest } = options || {};
          getInput(index)?.focus(rest);
        } else {
          getInput(options ?? 0)?.focus();
        }
      },
      blur: () => {
        getInput(0)?.blur();
        getInput(1)?.blur();
      },
    });

    // ======================== Props =========================
    const rootProps = useRootProps(reactiveComputed(() => restProps));

    // ===================== Placeholder ======================
    const mergedPlaceholder = computed<[string, string]>(() =>
      Array.isArray(placeholder) ? placeholder : [placeholder, placeholder],
    );

    // ======================== Inputs ========================
    const [getInputProps] = useInputProps(
      reactiveComputed(() => ({
        ...props,
        id: ids.value,
        placeholder: mergedPlaceholder.value,
      })),
    );

    // ====================== ActiveBar =======================
    const activeBarStyle = ref<CSSProperties>({
      position: 'absolute',
      width: 0,
    });

    const syncActiveOffset = () => {
      const input = getInput(activeIndex);
      if (input) {
        const inputRect = input.nativeElement.getBoundingClientRect();
        const parentRect = rootRef.value.getBoundingClientRect();

        const rectOffset = inputRect.left - parentRect.left;
        activeBarStyle.value = {
          ...activeBarStyle.value,
          width: `${inputRect.width}px`,
          left: `${rectOffset}px`,
        };
        onActiveInfo([inputRect.left, inputRect.right, parentRect.width]);
      }
    };

    watch(
      () => activeIndex,
      () => {
        syncActiveOffset();
      },
      { immediate: true },
    );

    // ======================== Clear =========================
    const showClear = computed(() => clearIcon && ((value[0] && !disabled[0]) || (value[1] && !disabled[1])));

    // ======================= Disabled =======================
    const startAutoFocus = computed(() => autofocus && !disabled[0]);
    const endAutoFocus = computed(() => autofocus && !startAutoFocus.value && !disabled[1]);

    // ======================== Render ========================
    return () => (
      <ResizeObserver onResize={syncActiveOffset}>
        <div
          {...rootProps}
          class={clsx(
            prefixCls,
            `${prefixCls}-range`,
            {
              [`${prefixCls}-focused`]: focused,
              [`${prefixCls}-disabled`]: disabled.every((i) => i),
              [`${prefixCls}-invalid`]: invalid.some((i) => i),
              [`${prefixCls}-rtl`]: rtl,
            },
            className,
          )}
          style={style}
          ref={rootRef}
          // Not lose value input focus
          onMousedown={(e) => {
            const { target } = e;
            if (target !== inputStartRef.value.inputElement && target !== inputEndRef.value.inputElement) {
              e.preventDefault();
            }

            onMousedown?.(e);
          }}
          {...{
            onClick,
          }}
        >
          <div v-if={prefix} class={clsx(`${prefixCls}-prefix`, classNames.prefix)} style={styles.prefix}>
            {prefix}
          </div>
          <Input
            ref={inputStartRef}
            {...getInputProps(0)}
            class={`${prefixCls}-input-start`}
            autofocus={startAutoFocus.value}
            tabindex={tabindex}
            date-range="start"
          />
          <div class={`${prefixCls}-range-separator`}>{separator}</div>
          <Input
            ref={inputEndRef}
            {...getInputProps(1)}
            class={`${prefixCls}-input-end`}
            autofocus={endAutoFocus.value}
            tabindex={tabindex}
            date-range="end"
          />
          <div class={`${prefixCls}-active-bar`} style={activeBarStyle.value} />
          <Icon type="suffix" icon={suffixIcon} />
          <ClearIcon v-if={showClear} icon={clearIcon} onClear={onClear} />
        </div>
      </ResizeObserver>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'RangeSelector' : undefined },
);

export default RefRangeSelector;
