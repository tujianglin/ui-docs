import { BaseInput } from '@vc-com/input';
import { type HolderRef } from '@vc-com/input/BaseInput';
import useCount from '@vc-com/input/hooks/useCount';
import { resolveOnChange } from '@vc-com/input/utils/commonUtils';
import Render from '@vc-com/render';
import { clsx } from 'clsx';
import { computed, defineComponent, ref, shallowRef, watch } from 'vue';
import {
  useRef,
  type ChangeEvent,
  type CompositionEvent,
  type CompositionEventHandler,
  type FocusEventHandler,
  type KeyboardEvent,
} from 'vue-jsx-vapor';
import ResizableTextArea from './ResizableTextArea';
import type { ResizableTextAreaRef, TextAreaProps } from './interface';

const TextArea = defineComponent(
  ({
    onFocus,
    onBlur,
    onChange,
    allowClear,
    maxlength,
    onCompositionstart,
    onCompositionend,
    suffix,
    prefixCls = 'rc-textarea',
    showCount,
    count,
    class: className,
    style,
    disabled,
    hidden,
    classNames,
    styles,
    onResize,
    onClear,
    onPressEnter,
    readonly,
    autoSize,
    onKeydown,
    ...rest
  }: TextAreaProps) => {
    const value = defineModel<string>('value', { default: '' });
    const formatValue = computed(() => (value.value === undefined || value.value === null ? '' : String(value.value)));

    const focused = ref(false);

    const compositionRef = shallowRef(false);

    const textareaResized = ref<boolean>(null);

    // =============================== Ref ================================
    const holderRef = useRef<HolderRef>(null);
    const resizableTextAreaRef = useRef<ResizableTextAreaRef>(null);
    const getTextArea = () => resizableTextAreaRef.value?.textArea;

    const focus = () => {
      getTextArea().focus();
    };

    defineExpose({
      get resizableTextArea() {
        return resizableTextAreaRef.value;
      },
      focus,
      blur: () => {
        getTextArea().blur();
      },
      get nativeElement() {
        return holderRef.value?.nativeElement || getTextArea();
      },
    });

    watch(
      () => disabled,
      () => {
        focused.value = !disabled && focused.value;
      },
      { immediate: true },
    );

    // =========================== Select Range ===========================
    const selection = ref<[start: number, end: number] | null>(null);

    watch(
      selection,
      () => {
        if (selection.value) {
          getTextArea().setSelectionRange(...selection.value);
        }
      },
      { immediate: true, deep: true },
    );

    // ============================== Count ===============================
    const countConfig = useCount(
      computed(() => count),
      computed(() => showCount),
    );
    const mergedMax = computed(() => countConfig.max ?? (maxlength as number));

    // Max length value
    const hasMaxLength = computed(() => Number(mergedMax.value) > 0);

    const valueLength = computed(() => countConfig.strategy(value.value));

    const isOutOfRange = computed(() => !!mergedMax.value && valueLength.value > mergedMax.value);

    // ============================== Change ==============================
    const triggerChange = (e: ChangeEvent<HTMLTextAreaElement> | CompositionEvent<HTMLTextAreaElement>, currentValue: string) => {
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
          selection.value = [getTextArea().selectionStart || 0, getTextArea().selectionEnd || 0];
        }
      }
      const textarea = getTextArea();
      if (!compositionRef.value && textarea && textarea.value !== cutValue) {
        textarea.value = cutValue;
      }

      value.value = cutValue;

      resolveOnChange(e.currentTarget, e, onChange, cutValue);
    };

    // =========================== Value Update ===========================
    const onInternalCompositionStart: CompositionEventHandler<HTMLTextAreaElement> = (e) => {
      compositionRef.value = true;
      onCompositionstart?.(e);
    };

    const onInternalCompositionEnd: CompositionEventHandler<HTMLTextAreaElement> = (e) => {
      compositionRef.value = false;
      triggerChange(e, e.currentTarget.value);
      onCompositionend?.(e);
    };

    const onInternalChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      triggerChange(e, e.target.value);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && onPressEnter && !(e as any).isComposing) {
        onPressEnter(e);
      }
      onKeydown?.(e);
    };

    const handleFocus: FocusEventHandler<HTMLTextAreaElement> = (e) => {
      focused.value = true;
      onFocus?.(e);
    };

    const handleBlur: FocusEventHandler<HTMLTextAreaElement> = (e) => {
      focused.value = false;
      onBlur?.(e);
    };

    // ============================== Reset ===============================
    const handleReset = (e) => {
      value.value = '';
      focus();
      resolveOnChange(getTextArea(), e, onChange);
    };

    const DataNode = () => {
      let dataCount;
      if (countConfig.show) {
        if (countConfig.showFormatter) {
          dataCount = countConfig.showFormatter({
            value: formatValue.value,
            count: valueLength.value,
            maxlength: mergedMax.value,
          });
        } else {
          dataCount = `${valueLength.value}${hasMaxLength.value ? ` / ${mergedMax.value}` : ''}`;
        }
      }
      return dataCount;
    };
    const SuffixNode = () => {
      let suffixNode = suffix;
      if (countConfig.show) {
        suffixNode = (
          <>
            <Render content={suffixNode}></Render>
            <span class={clsx(`${prefixCls}-data-count`, classNames?.count)} style={styles?.count}>
              <DataNode></DataNode>
            </span>
          </>
        );
      }
      return suffixNode;
    };

    const handleResize: TextAreaProps['onResize'] = (size) => {
      onResize?.(size);
      if (getTextArea()?.style.height) {
        textareaResized.value = true;
      }
    };

    const isPureTextArea = computed(() => !autoSize && !showCount && !allowClear);

    return () => (
      <BaseInput
        ref={holderRef}
        value={formatValue.value}
        allowClear={allowClear}
        handleReset={handleReset}
        suffix={SuffixNode()}
        prefixCls={prefixCls}
        classNames={{
          ...classNames,
          affixWrapper: clsx(classNames?.affixWrapper, {
            [`${prefixCls}-show-count`]: showCount,
            [`${prefixCls}-textarea-allow-clear`]: allowClear,
          }),
        }}
        disabled={disabled}
        focused={focused.value}
        class={clsx(className, isOutOfRange.value && `${prefixCls}-out-of-range`)}
        style={{
          ...style,
          ...(textareaResized.value && !isPureTextArea.value ? { height: 'auto' } : {}),
        }}
        dataAttrs={{
          affixWrapper: {
            'data-count': typeof DataNode() === 'string' ? DataNode() : undefined,
          },
        }}
        hidden={hidden}
        readonly={readonly}
        onClear={onClear}
      >
        <ResizableTextArea
          {...rest}
          autoSize={autoSize}
          maxlength={maxlength}
          onKeydown={handleKeyDown}
          onChange={onInternalChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onCompositionstart={onInternalCompositionStart}
          onCompositionend={onInternalCompositionEnd}
          class={clsx(classNames?.textarea)}
          style={{ resize: style?.resize, ...styles?.textarea }}
          disabled={disabled}
          prefixCls={prefixCls}
          onResize={handleResize}
          ref={resizableTextAreaRef}
          readonly={readonly}
        />
      </BaseInput>
    );
  },
  { inheritAttrs: false },
);

export default TextArea;
