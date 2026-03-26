// oxlint-disable no-unused-vars
import type { RenderNode } from '@vc-com/util/lib/types';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent } from 'vue';
import { useFullProps, useRef } from 'vue-jsx-vapor';
import type { DateType, InternalMode, SelectorProps } from '../../../interface';
import { isSame } from '../../../utils/dateUtil';
import type { PickerProps } from '../../SinglePicker';
import { usePickerContextInject } from '../../context';
import Icon, { ClearIcon } from '../Icon';
import Input, { type InputRef } from '../Input';
import useInputProps from '../hooks/useInputProps';
import useRootProps from '../hooks/useRootProps';
import MultipleDates from './MultipleDates';

export interface SingleSelectorProps extends SelectorProps, Pick<PickerProps, 'multiple' | 'maxTagCount'> {
  id?: string;

  value?: DateType[];
  onChange: (date: DateType[]) => void;

  internalPicker: InternalMode;

  disabled: boolean;

  /** All the field show as `placeholder` */
  allHelp: boolean;

  placeholder?: string;

  // Invalid
  invalid: boolean;
  onInvalid: (valid: boolean) => void;

  removeIcon?: RenderNode;
}

const SingleSelector = defineComponent(
  ({
    id,

    open,

    prefix,
    clearIcon,
    suffixIcon,
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
    internalPicker,
    value,
    onChange,
    onSubmit,
    onInputChange,
    multiple,
    maxTagCount,

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

    // Native
    onMousedown,

    // Input
    required,
    'aria-required': ariaRequired,
    autofocus,
    tabindex,

    removeIcon,

    ...restProps
  }: SingleSelectorProps) => {
    const props = useFullProps() as SingleSelectorProps;

    const rtl = computed(() => direction === 'rtl');

    // ======================== Prefix ========================
    const { prefixCls, classNames, styles } = $(usePickerContextInject());

    // ========================= Refs =========================
    const rootRef = useRef<HTMLDivElement>();
    const inputRef = useRef<InputRef>();

    defineExpose({
      get nativeElement() {
        return rootRef.value;
      },
      focus: (options) => {
        inputRef.value?.focus(options);
      },
      blur: () => {
        inputRef.value?.blur();
      },
    });

    // ======================== Props =========================
    const rootProps = useRootProps(restProps);

    // ======================== Change ========================
    const onSingleChange = (date: DateType) => {
      onChange([date]);
    };

    const onMultipleRemove = (date: DateType) => {
      const nextValues = value.filter((oriDate) => oriDate && !isSame(generateConfig, locale, oriDate, date, internalPicker));
      onChange(nextValues);

      // When `open`, it means user is operating the
      if (!open) {
        onSubmit();
      }
    };

    // ======================== Inputs ========================
    const [getInputProps, getText] = useInputProps(
      reactiveComputed(() => ({
        ...props,
        onChange: onSingleChange,
      })),
      ({ valueTexts }) => ({
        value: valueTexts[0] || '',
        active: focused,
      }),
    );

    // ======================== Clear =========================
    const showClear = computed(() => !!(clearIcon && value.length && !disabled));

    return () => {
      // ======================= Multiple =======================
      const selectorNode = multiple ? (
        <>
          <MultipleDates
            prefixCls={prefixCls}
            value={value}
            onRemove={onMultipleRemove}
            formatDate={getText}
            maxTagCount={maxTagCount}
            disabled={disabled}
            removeIcon={removeIcon}
            placeholder={placeholder}
          />
          <input
            class={`${prefixCls}-multiple-input`}
            value={value.map(getText).join(',')}
            ref={inputRef}
            readonly
            autofocus={autofocus}
            tabindex={tabindex}
          />
          <Icon type="suffix" icon={suffixIcon} />
          <ClearIcon v-if={showClear.value} icon={clearIcon} onClear={onClear} />
        </>
      ) : (
        <Input
          ref={inputRef}
          {...getInputProps()}
          autofocus={autofocus}
          tabindex={tabindex}
          suffixIcon={suffixIcon}
          clearIcon={showClear.value && <ClearIcon icon={clearIcon} onClear={onClear} />}
          showActiveCls={false}
        />
      );

      // ======================== Render ========================
      return (
        <div
          {...rootProps}
          class={clsx(
            prefixCls,
            {
              [`${prefixCls}-multiple`]: multiple,
              [`${prefixCls}-focused`]: focused,
              [`${prefixCls}-disabled`]: disabled,
              [`${prefixCls}-invalid`]: invalid,
              [`${prefixCls}-rtl`]: rtl.value,
            },
            className,
          )}
          style={style}
          ref={rootRef}
          // Not lose value input focus
          onMousedown={(e) => {
            const { target } = e;
            if (target !== inputRef.value?.inputElement) {
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
          {selectorNode}
        </div>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'SingleSelector' : undefined },
);

export default SingleSelector;
