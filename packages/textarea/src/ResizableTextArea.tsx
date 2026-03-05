import ResizeObserver from '@vc-com/resize-observer';
import raf from '@vc-com/util/lib/raf';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent, nextTick, onBeforeUnmount, ref, shallowRef, watch, type CSSProperties } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import type { TextAreaProps } from '.';
import calculateAutoSizeStyle from './calculateNodeHeight';
import type { HTMLTextareaProps } from './interface';

const RESIZE_START = 0 as const;
const RESIZE_MEASURING = 1 as const;
const RESIZE_STABLE = 2 as const;

type ResizeState = typeof RESIZE_START | typeof RESIZE_MEASURING | typeof RESIZE_STABLE;

const ResizableTextArea = defineComponent(
  (props: TextAreaProps) => {
    const {
      prefixCls,
      autoSize,
      onResize,
      class: className,
      style,
      disabled,
      onChange,
      // Test only
      onInternalAutoSize,
      ...restProps
    } = props as TextAreaProps & {
      onInternalAutoSize?: VoidFunction;
    };

    const internalValue = defineModel<HTMLTextareaProps['value'] | bigint>('value');

    // =============================== Value ================================
    const mergedValue = computed(() => internalValue.value ?? '');

    const onInternalChange = (event) => {
      onChange?.(event);
    };

    // ================================ Ref =================================
    const textareaRef = useRef<HTMLTextAreaElement>();

    defineExpose({
      get textArea() {
        return textareaRef.value;
      },
    });

    // ============================== AutoSize ==============================
    const { minRows, maxRows } = $(
      reactiveComputed((): { minRows?: number; maxRows?: number } => {
        if (autoSize && typeof autoSize === 'object') {
          return { minRows: autoSize.minRows, maxRows: autoSize.maxRows };
        }

        return {};
      }),
    );

    const needAutoSize = computed(() => !!autoSize);

    // =============================== Resize ===============================
    const resizeState = ref<ResizeState>(RESIZE_STABLE);
    const autoSizeStyle = ref<CSSProperties>();

    const startResize = () => {
      resizeState.value = RESIZE_START;
      if (process.env.NODE_ENV === 'test') {
        onInternalAutoSize?.();
      }
    };

    // Change to trigger resize measure
    watch(
      [internalValue, () => minRows, () => maxRows, needAutoSize],
      async () => {
        await nextTick();
        if (needAutoSize.value) {
          startResize();
        }
      },
      { immediate: true, flush: 'post' },
    );

    watch(
      resizeState,
      async () => {
        await nextTick();
        if (resizeState.value === RESIZE_START) {
          resizeState.value = RESIZE_MEASURING;
        } else if (resizeState.value === RESIZE_MEASURING) {
          const textareaStyles = calculateAutoSizeStyle(textareaRef.value, false, minRows, maxRows);

          // Safari has bug that text will keep break line on text cut when it's prev is break line.
          // ZombieJ: This not often happen. So we just skip it.
          // const { selectionStart, selectionEnd, scrollTop } = textareaRef.value;
          // const { value: tmpValue } = textareaRef.value;
          // textareaRef.value.value = '';
          // textareaRef.value.value = tmpValue;

          // if (document.activeElement === textareaRef.value) {
          //   textareaRef.value.scrollTop = scrollTop;
          //   textareaRef.value.setSelectionRange(selectionStart, selectionEnd);
          // }

          resizeState.value = RESIZE_STABLE;
          autoSizeStyle.value = textareaStyles;
        } else {
          // https://github.com/react-component/textarea/pull/23
          // Firefox has blink issue before but fixed in latest version.
        }
      },
      { immediate: true, flush: 'post' },
    );

    // We lock resize trigger by raf to avoid Safari warning
    const resizeRafRef = shallowRef<number>();
    const cleanRaf = () => {
      raf.cancel(resizeRafRef.value);
    };

    const onInternalResize = (size: { width: number; height: number }) => {
      if (resizeState.value === RESIZE_STABLE) {
        onResize?.(size);

        if (autoSize) {
          cleanRaf();
          resizeRafRef.value = raf(() => {
            startResize();
          });
        }
      }
    };

    onBeforeUnmount(cleanRaf);

    // =============================== Render ===============================
    const mergedStyle = computed(() => {
      const mergedAutoSizeStyle = needAutoSize.value ? autoSizeStyle.value : null;

      const result: CSSProperties = {
        ...(style as CSSProperties),
        ...mergedAutoSizeStyle,
      };

      if (resizeState.value === RESIZE_START || resizeState.value === RESIZE_MEASURING) {
        result.overflowY = 'hidden';
        result.overflowX = 'hidden';
      }
      return result;
    });

    return () => (
      <ResizeObserver onResize={onInternalResize} disabled={!(autoSize || onResize)}>
        <textarea
          {...restProps}
          ref={textareaRef}
          style={mergedStyle.value}
          class={clsx(prefixCls, className, {
            [`${prefixCls}-disabled`]: disabled,
          })}
          disabled={disabled}
          value={mergedValue.value as string}
          onInput={onInternalChange}
        />
      </ResizeObserver>
    );
  },
  { inheritAttrs: false },
);

export default ResizableTextArea;
