import { triggerFocus, type InputFocusOptions } from '@vc-com/util/lib/Dom/focus';
import omit from '@vc-com/util/lib/omit';
import { resolveVNode } from '@vc-com/util/lib/vnode';
import { clsx } from 'clsx';
import { computed, defineComponent, ref, watch } from 'vue';
import {
  useFullProps,
  useRef,
  type ChangeEvent,
  type ChangeEventHandler,
  type CompositionEvent,
  type FocusEventHandler,
  type KeyboardEvent,
} from 'vue-jsx-vapor';
import type { HolderRef } from './BaseInput';
import BaseInput from './BaseInput';
import useCount from './hooks/useCount';
import type { ChangeEventInfo, InputProps, ValueType } from './interface';
import { resolveOnChange } from './utils/commonUtils';

const Input = defineComponent(
  ({
    autoComplete,
    onChange,
    onFocus,
    onBlur,
    onPressEnter,
    onKeydown,
    onKeyup,
    prefixCls = 'rc-input',
    disabled,
    htmlSize,
    class: className,
    maxlength,
    suffix,
    showCount,
    count,
    type = 'text',
    classNames,
    styles,
    onCompositionstart,
    onCompositionend,
    ...rest
  }: InputProps) => {
    const props = useFullProps() as InputProps;
    const value = defineModel<ValueType>('value');
    const focused = ref<boolean>(false);
    const compositionRef = useRef(false);
    const keyLockRef = useRef(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const holderRef = useRef<HolderRef>(null);

    const focus = (option?: InputFocusOptions) => {
      if (inputRef.value) {
        triggerFocus(inputRef.value, option);
      }
    };

    // ====================== Value =======================
    const formatValue = computed(() => (value.value === undefined || value.value === null ? '' : String(value.value)));

    // =================== Select Range ===================
    const selection = ref<[start: number, end: number] | null>(null);

    // ====================== Count =======================
    const countConfig = useCount(
      computed(() => count),
      computed(() => showCount),
    );
    const mergedMax = computed(() => countConfig.max || (maxlength as number));
    const valueLength = computed(() => countConfig.strategy(formatValue.value));

    const isOutOfRange = computed(() => !!mergedMax.value && valueLength.value > mergedMax.value);

    // ======================= Ref ========================
    defineExpose({
      focus,
      blur: () => {
        inputRef.value?.blur();
      },
      setSelectionRange: (start: number, end: number, direction?: 'forward' | 'backward' | 'none') => {
        inputRef.value?.setSelectionRange(start, end, direction);
      },
      select: () => {
        inputRef.value?.select();
      },
      get input() {
        return inputRef.value;
      },
      get nativeElement() {
        return holderRef.value?.nativeElement || inputRef.value;
      },
    });

    watch(
      [() => disabled],
      () => {
        if (keyLockRef.value) {
          keyLockRef.value = false;
        }
        focused.value = focused.value && disabled ? false : focused.value;
      },
      { immediate: true },
    );

    const triggerChange = (
      e: ChangeEvent<HTMLInputElement> | CompositionEvent<HTMLInputElement>,
      currentValue: string,
      info: ChangeEventInfo,
    ) => {
      let cutValue = currentValue;

      if (
        !compositionRef.value &&
        countConfig.exceedFormatter &&
        countConfig.max &&
        countConfig.strategy(currentValue) > countConfig.max
      ) {
        cutValue = countConfig.exceedFormatter(currentValue, {
          max: countConfig.max,
        });

        if (currentValue !== cutValue) {
          selection.value = [inputRef.value?.selectionStart || 0, inputRef.value?.selectionEnd || 0];
        }
      } else if (info.source === 'compositionEnd') {
        // Avoid triggering twice
        // https://github.com/ant-design/ant-design/issues/46587
        return;
      }
      value.value = cutValue;

      if (inputRef.value) {
        resolveOnChange(inputRef.value, e, onChange, cutValue);
      }
    };

    watch(
      [selection],
      () => {
        if (selection.value) {
          inputRef.value?.setSelectionRange(...selection.value);
        }
      },
      { immediate: true, deep: true },
    );

    const onInternalChange: ChangeEventHandler<HTMLInputElement> = (e) => {
      triggerChange(e, e.target.value, {
        source: 'change',
      });
    };

    const onInternalCompositionEnd = (e: CompositionEvent<HTMLInputElement>) => {
      compositionRef.value = false;
      triggerChange(e, e.currentTarget.value, {
        source: 'compositionEnd',
      });
      onCompositionend?.(e);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (onPressEnter && e.key === 'Enter' && !keyLockRef.value && !e.nativeEvent.isComposing) {
        keyLockRef.value = true;
        onPressEnter(e);
      }
      onKeydown?.(e);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        keyLockRef.value = false;
      }
      onKeyup?.(e);
    };

    const handleFocus: FocusEventHandler<HTMLInputElement> = (e) => {
      focused.value = true;
      onFocus?.(e);
    };

    const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
      if (keyLockRef.value) {
        keyLockRef.value = false;
      }
      focused.value = false;
      onBlur?.(e);
    };

    const handleReset = (e) => {
      value.value = '';
      focus();
      if (inputRef.value) {
        resolveOnChange(inputRef.value, e, onChange);
      }
    };

    // ====================== Input =======================
    const outOfRangeCls = computed(() => isOutOfRange.value && `${prefixCls}-out-of-range`);

    const getInputElement = () => {
      // Fix https://fb.me/react-unknown-prop
      const otherProps = omit(props as Omit<InputProps, 'value'>, [
        'prefixCls',
        'onPressEnter',
        'addonBefore',
        'addonAfter',
        'prefix',
        'suffix',
        'allowClear',
        // Input elements must be either controlled or uncontrolled,
        // specify either the value prop, or the defaultValue prop, but not both.
        'showCount',
        'count',
        'htmlSize',
        'styles',
        'classNames',
        'onClear',
      ]);
      return (
        <input
          autocomplete={autoComplete}
          {...otherProps}
          v-model={value.value}
          onChange={onInternalChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeydown={handleKeyDown}
          onKeyup={handleKeyUp}
          class={clsx(
            prefixCls,
            {
              [`${prefixCls}-disabled`]: disabled,
            },
            classNames?.input,
          )}
          style={styles?.input}
          ref={inputRef}
          size={htmlSize}
          type={type}
          onCompositionstart={(e) => {
            compositionRef.value = true;
            onCompositionstart?.(e);
          }}
          onCompositionend={onInternalCompositionEnd}
        />
      );
    };

    const getSuffix = () => {
      // Max length value
      const hasMaxLength = Number(mergedMax.value) > 0;

      if (suffix || countConfig.show) {
        const dataCount = countConfig.showFormatter
          ? countConfig.showFormatter({
              value: formatValue.value,
              count: valueLength.value,
              maxlength: mergedMax.value,
            })
          : `${valueLength.value}${hasMaxLength ? ` / ${mergedMax.value}` : ''}`;

        return (
          <>
            {countConfig.show && (
              <span
                class={clsx(
                  `${prefixCls}-show-count-suffix`,
                  {
                    [`${prefixCls}-show-count-has-suffix`]: !!suffix,
                  },
                  classNames?.count,
                )}
                style={{
                  ...styles?.count,
                }}
              >
                {dataCount}
              </span>
            )}
            {resolveVNode(suffix)}
          </>
        );
      }
      return null;
    };

    // ====================== Render ======================
    return () => (
      <BaseInput
        {...(rest as any)}
        v-model:value={value.value}
        prefixCls={prefixCls}
        class={clsx(className, outOfRangeCls.value)}
        handleReset={handleReset}
        value={formatValue.value}
        focused={focused.value}
        triggerFocus={focus}
        suffix={getSuffix()}
        disabled={disabled as boolean}
        classNames={classNames}
        styles={styles}
        ref={holderRef}
      >
        {getInputElement()}
      </BaseInput>
    );
  },
  { inheritAttrs: false },
);

export default Input;
