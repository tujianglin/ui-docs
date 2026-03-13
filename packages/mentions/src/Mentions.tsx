import { BaseInput } from '@vc-com/input';
import type { HolderRef } from '@vc-com/input/BaseInput';
import type { CommonInputProps } from '@vc-com/input/interface';
import type { TextAreaProps, TextAreaRef } from '@vc-com/textarea';
import TextArea from '@vc-com/textarea';
import useControlledState from '@vc-com/util/lib/hooks/useControlledState';
import { useId } from '@vc-com/util/lib/hooks/useId';
import KeyCode from '@vc-com/util/lib/KeyCode';
import type { RenderNode } from '@vc-com/util/lib/types';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent, ref, watch, type CSSProperties } from 'vue';
import {
  useFullProps,
  useRef,
  type ChangeEventHandler,
  type FocusEvent,
  type FocusEventHandler,
  type KeyboardEventHandler,
  type UIEvent,
  type UIEventHandler,
} from 'vue-jsx-vapor';
import { useUnstableContextInject } from './context';
import useEffectState from './hooks/useEffectState';
import KeywordTrigger from './KeywordTrigger';
import { MentionsContextProvider } from './MentionsContext';
import type { OptionProps } from './Option';
import Option from './Option';
import {
  filterOption as defaultFilterOption,
  validateSearch as defaultValidateSearch,
  getBeforeSelectionText,
  getLastMeasureIndex,
  replaceWithMeasure,
  setInputSelection,
} from './util';

type BaseTextareaAttrs = Omit<TextAreaProps, 'prefix' | 'onChange' | 'onSelect' | 'showCount' | 'classNames'>;

export type Placement = 'top' | 'bottom';
export type Direction = 'ltr' | 'rtl';

export interface DataDrivenOptionProps extends Omit<OptionProps, 'children'> {
  label?: RenderNode;
}

export interface MentionsProps extends BaseTextareaAttrs {
  id?: string;
  autofocus?: boolean;
  class?: string;
  defaultValue?: string;
  notFoundContent?: RenderNode;
  split?: string;
  style?: CSSProperties;
  transitionName?: string;
  placement?: Placement;
  direction?: Direction;
  prefix?: string | string[];
  prefixCls?: string;
  value?: string;
  silent?: boolean;
  filterOption?: false | typeof defaultFilterOption;
  validateSearch?: typeof defaultValidateSearch;
  onChange?: (text: string) => void;
  onSelect?: (option: OptionProps, prefix: string) => void;
  onSearch?: (text: string, prefix: string) => void;
  onFocus?: FocusEventHandler<HTMLTextAreaElement>;
  onBlur?: FocusEventHandler<HTMLTextAreaElement>;
  getPopupContainer?: () => HTMLElement;
  popupClassName?: string;
  options?: DataDrivenOptionProps[];
  classNames?: CommonInputProps['classNames'] & {
    mentions?: string;
    textarea?: string;
    popup?: string;
  };
  styles?: {
    suffix?: CSSProperties;
    textarea?: CSSProperties;
    popup?: CSSProperties;
  };
  onPopupScroll?: (event: UIEvent<HTMLDivElement>) => void;
}

export interface MentionsRef {
  focus: VoidFunction;
  blur: VoidFunction;

  /** @deprecated It may not work as expected */
  textarea: HTMLTextAreaElement | null;

  nativeElement: HTMLElement;
}

interface InternalMentionsProps extends MentionsProps {
  hasWrapper: boolean;
}

const InternalMentions = defineComponent(
  ({
    // Style
    prefixCls,
    class: className,
    style,
    classNames: mentionClassNames,
    styles,

    // Misc
    prefix = ['@'],
    split = ' ',
    notFoundContent = 'Not Found',
    value,
    defaultValue,
    options,
    allowClear: _,
    hasWrapper,
    silent,

    // Events
    validateSearch = defaultValidateSearch,
    filterOption = defaultFilterOption,
    onChange,
    onKeydown,
    onKeyup,
    onPressEnter,
    onSearch,
    onSelect,

    onFocus,
    onBlur,

    // Dropdown
    transitionName,
    placement,
    direction,
    getPopupContainer,
    popupClassName,

    rows = 1,

    // Fix Warning: Received `false` for a non-boolean attribute `visible`.
    // https://github.com/ant-design/ant-design/blob/df933e94efc8f376003bbdc658d64b64a0e53495/components/mentions/demo/render-panel.tsx
    // @ts-expect-error
    visible: _1,
    onPopupScroll,

    // Rest
    ...restProps
  }: InternalMentionsProps) => {
    const props = useFullProps() as unknown as InternalMentionsProps;
    const mergedPrefix = computed(() => (Array.isArray(prefix) ? prefix : [prefix]));

    // =============================== Refs ===============================
    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<TextAreaRef>(null);
    const measureRef = useRef<HTMLDivElement>(null);

    const getTextArea = () => textareaRef.value?.resizableTextArea?.textArea;

    defineExpose({
      focus: () => textareaRef.value?.focus(),
      blur: () => textareaRef.value?.blur(),
      get textarea() {
        return textareaRef.value?.resizableTextArea?.textArea;
      },
      get nativeElement() {
        return containerRef.value;
      },
    });

    // ============================== State ===============================
    const measuring = ref(false);
    const measureText = ref('');
    const measurePrefix = ref('');
    const measureLocation = ref(0);
    const activeIndex = ref(0);
    const isFocus = ref(false);

    // ================================ Id ================================
    const uniqueKey = useId(props.id);

    // ============================== Value ===============================
    const [mergedValue, setMergedValue] = useControlledState(
      defaultValue || '',
      computed(() => value),
    );

    // =============================== Open ===============================
    const { open } = $(useUnstableContextInject());

    watch(
      measuring,
      () => {
        // Sync measure div top with textarea for rc-trigger usage
        if (measuring.value && measureRef.value) {
          measureRef.value.scrollTop = getTextArea().scrollTop;
        }
      },
      { immediate: true },
    );

    const { mergedMeasuring, mergedMeasureText, mergedMeasurePrefix, mergedMeasureLocation } = $(
      reactiveComputed(() => {
        if (open) {
          for (let i = 0; i < mergedPrefix.value.length; i += 1) {
            const curPrefix = mergedPrefix.value[i];
            const index = mergedValue.value.lastIndexOf(curPrefix);
            if (index >= 0) {
              return {
                mergedMeasuring: true,
                mergedMeasureText: '',
                mergedMeasurePrefix: curPrefix,
                mergedMeasureLocation: index,
              };
            }
          }
        }

        return {
          mergedMeasuring: measuring.value,
          mergedMeasureText: measureText.value,
          mergedMeasurePrefix: measurePrefix.value,
          mergedMeasureLocation: measureLocation.value,
        };
      }),
    );

    // ============================== Option ==============================
    const getOptions = (targetMeasureText: string) => {
      let list = [];

      if (options && options.length > 0) {
        list = options.map((item) => ({
          ...item,
          key: `${item?.key ?? item.value}-${uniqueKey}`,
        }));
      }

      return list.filter((option: OptionProps) => {
        /** Return all result if `filterOption` is false. */
        if (filterOption === false) {
          return true;
        }
        return filterOption(targetMeasureText, option);
      });
    };

    const mergedOptions = computed(() => getOptions(mergedMeasureText));

    const getEnabledActiveIndex = (index: number, offset: number = 1): number => {
      const len = mergedOptions.value.length;
      if (!len) {
        return -1;
      }

      for (let i = 0; i < len; i += 1) {
        const current = (index + i * offset + len) % len;
        const option = mergedOptions.value[current];
        if (!option?.disabled) {
          return current;
        }
      }

      return -1;
    };

    watch(
      [() => mergedMeasuring, mergedOptions, activeIndex],
      () => {
        if (!mergedMeasuring) {
          return;
        }

        const currentOption = mergedOptions.value[activeIndex.value];
        if (!currentOption || currentOption.disabled) {
          activeIndex.value = getEnabledActiveIndex(0);
        }
      },
      { immediate: true, deep: true },
    );

    // ============================= Measure ==============================
    // Mark that we will reset input selection to target position when user select option
    const onSelectionEffect = useEffectState();

    const startMeasure = (nextMeasureText: string, nextMeasurePrefix: string, nextMeasureLocation: number) => {
      measuring.value = true;
      measureText.value = nextMeasureText;
      measurePrefix.value = nextMeasurePrefix;
      measureLocation.value = nextMeasureLocation;
      activeIndex.value = getEnabledActiveIndex(0);
    };

    const stopMeasure = (callback?: VoidFunction) => {
      measuring.value = false;
      measureLocation.value = 0;
      measureText.value = '';
      onSelectionEffect(callback);
    };

    // ============================== Change ==============================
    const triggerChange = (nextValue: string) => {
      setMergedValue(nextValue);
      onChange?.(nextValue);
    };

    const onInternalChange: ChangeEventHandler<HTMLTextAreaElement> = ({ target: { value: nextValue } }) => {
      triggerChange(nextValue);
    };

    const selectOption = (option?: OptionProps) => {
      if (!option || option.disabled) {
        return;
      }
      const { value: mentionValue = '' } = option;
      const { text, selectionLocation } = replaceWithMeasure(mergedValue.value, {
        measureLocation: mergedMeasureLocation,
        targetText: mentionValue,
        prefix: mergedMeasurePrefix,
        selectionStart: getTextArea()?.selectionStart,
        split,
      });
      triggerChange(text);
      stopMeasure(() => {
        // We need restore the selection position
        setInputSelection(getTextArea(), selectionLocation);
      });

      onSelect?.(option, mergedMeasurePrefix);
    };

    // ============================= KeyEvent =============================
    // Check if hit the measure keyword
    const onInternalKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
      const { which } = event;

      onKeydown?.(event);

      // Skip if not measuring
      if (!mergedMeasuring) {
        return;
      }

      if (which === KeyCode.UP || which === KeyCode.DOWN) {
        // Control arrow function
        const optionLen = mergedOptions.value.length;
        if (!optionLen) {
          return;
        }
        const offset = which === KeyCode.UP ? -1 : 1;
        const newActiveIndex = getEnabledActiveIndex(activeIndex.value + offset, offset);
        if (newActiveIndex !== -1) {
          activeIndex.value = newActiveIndex;
        }
        event.preventDefault();
      } else if (which === KeyCode.ESC) {
        stopMeasure();
      } else if (which === KeyCode.ENTER) {
        // Measure hit
        event.preventDefault();
        // loading skip
        if (silent) {
          return;
        }

        if (!mergedOptions.value.length) {
          stopMeasure();
          return;
        }
        let targetIndex = activeIndex.value;
        if (!mergedOptions.value[targetIndex] || mergedOptions.value[targetIndex].disabled) {
          targetIndex = getEnabledActiveIndex(0);
        }

        if (targetIndex === -1) {
          stopMeasure();
          return;
        }

        activeIndex.value = targetIndex;
        selectOption(mergedOptions.value[targetIndex]);
      }
    };

    /**
     * When to start measure:
     * 1. When user press `prefix`
     * 2. When measureText !== prevMeasureText
     *  - If measure hit
     *  - If measuring
     *
     * When to stop measure:
     * 1. Selection is out of range
     * 2. Contains `space`
     * 3. ESC or select one
     */
    const onInternalKeyUp: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
      const { key, which } = event;
      const target = event.target as HTMLTextAreaElement;
      const selectionStartText = getBeforeSelectionText(target);
      const { location: measureIndex, prefix: nextMeasurePrefix } = getLastMeasureIndex(selectionStartText, mergedPrefix.value);

      // If the client implements an onKeyup handler, call it
      onKeyup?.(event);

      // Skip if match the white key list
      if ([KeyCode.ESC, KeyCode.UP, KeyCode.DOWN, KeyCode.ENTER].indexOf(which) !== -1) {
        return;
      }

      if (measureIndex !== -1) {
        const nextMeasureText = selectionStartText.slice(measureIndex + nextMeasurePrefix.length);
        const validateMeasure: boolean = validateSearch(nextMeasureText, split);
        const matchOption = !!getOptions(nextMeasureText).length;

        if (validateMeasure) {
          // adding AltGraph also fort azert keyboard
          if (
            key === nextMeasurePrefix ||
            key === 'Shift' ||
            which === KeyCode.ALT ||
            key === 'AltGraph' ||
            mergedMeasuring ||
            (nextMeasureText !== mergedMeasureText && matchOption)
          ) {
            startMeasure(nextMeasureText, nextMeasurePrefix, measureIndex);
          }
        } else if (mergedMeasuring) {
          // Stop if measureText is invalidate
          stopMeasure();
        }

        /**
         * We will trigger `onSearch` to developer since they may use for async update.
         * If met `space` means user finished searching.
         */
        if (onSearch && validateMeasure) {
          onSearch(nextMeasureText, nextMeasurePrefix);
        }
      } else if (mergedMeasuring) {
        stopMeasure();
      }
    };

    const onInternalPressEnter: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
      if (!mergedMeasuring && onPressEnter) {
        onPressEnter(event);
      }
    };

    // ============================ Focus Blur ============================
    const focusRef = useRef<number>();

    const onInternalFocus = (event?: FocusEvent<HTMLTextAreaElement>) => {
      window.clearTimeout(focusRef.value);
      if (!isFocus && event && onFocus) {
        onFocus(event);
      }
      isFocus.value = true;
    };

    const onInternalBlur = (event?: FocusEvent<HTMLTextAreaElement>) => {
      focusRef.value = window.setTimeout(() => {
        isFocus.value = false;
        stopMeasure();
        onBlur?.(event);
      }, 0);
    };

    const onDropdownFocus = () => {
      onInternalFocus();
    };

    const onDropdownBlur = () => {
      onInternalBlur();
    };

    // ============================== Scroll ===============================
    const onInternalPopupScroll: UIEventHandler<HTMLDivElement> = (event) => {
      onPopupScroll?.(event);
    };

    // ============================== Styles ==============================
    const mergedStyles = computed(() => {
      const resizeStyle = styles?.textarea?.resize ?? style?.resize;
      const mergedTextareaStyle = { ...styles?.textarea };

      // Only add resize if it has a valid value, avoid setting undefined
      if (resizeStyle !== undefined) {
        mergedTextareaStyle.resize = resizeStyle;
      }

      return {
        ...styles,
        textarea: mergedTextareaStyle,
      };
    });

    // ============================== Render ==============================
    return () => {
      const mentionNode = (
        <>
          <TextArea
            classNames={{ textarea: mentionClassNames?.textarea }}
            /**
             * Example:<Mentions style={{ resize: 'none' }} />.
             * If written this way, resizing here will become invalid.
             * The TextArea component code and found that the resize parameter in the style of the ResizeTextArea component is obtained from prop.style.
             * Just pass the resize attribute and leave everything else unchanged.
             */
            styles={mergedStyles.value}
            ref={textareaRef}
            value={mergedValue.value}
            {...restProps}
            rows={rows}
            onChange={onInternalChange}
            onKeydown={onInternalKeyDown}
            onKeyup={onInternalKeyUp as any}
            onPressEnter={onInternalPressEnter}
            onFocus={onInternalFocus}
            onBlur={onInternalBlur}
          />
          {mergedMeasuring && (
            <div ref={measureRef} class={`${prefixCls}-measure`}>
              {mergedValue.value.slice(0, mergedMeasureLocation)}
              <MentionsContextProvider
                value={{
                  notFoundContent,
                  activeIndex: activeIndex.value,
                  setActiveIndex: (e) => (activeIndex.value = e),
                  selectOption,
                  onFocus: onDropdownFocus,
                  onBlur: onDropdownBlur,
                  onScroll: onInternalPopupScroll as any,
                }}
              >
                <KeywordTrigger
                  prefixCls={prefixCls}
                  transitionName={transitionName}
                  placement={placement}
                  direction={direction}
                  options={mergedOptions.value}
                  visible
                  getPopupContainer={getPopupContainer}
                  popupClassName={clsx(popupClassName, mentionClassNames?.popup)}
                  popupStyle={styles?.popup}
                >
                  <span>{mergedMeasurePrefix}</span>
                </KeywordTrigger>
              </MentionsContextProvider>
              {mergedValue.value.slice(mergedMeasureLocation + mergedMeasurePrefix.length)}
            </div>
          )}
        </>
      );

      if (!hasWrapper) {
        return (
          <div class={clsx(prefixCls, className)} style={style} ref={containerRef}>
            {mentionNode}
          </div>
        );
      }

      return mentionNode;
    };
  },
);

const Mentions = defineComponent(
  ({
    suffix,
    prefixCls = 'rc-mentions',
    defaultValue,
    value: customValue,
    id,
    allowClear,
    onChange,
    classNames: mentionsClassNames,
    styles,
    class: className,
    disabled,
    onClear,
    ...rest
  }: MentionsProps) => {
    const hasSuffix = computed(() => !!(suffix || allowClear));

    // =============================== Ref ================================
    const holderRef = useRef<HolderRef>(null);
    const mentionRef = useRef<MentionsRef>(null);

    defineExpose({
      ...mentionRef.value,
      nativeElement: holderRef.value?.nativeElement || mentionRef.value?.nativeElement,
    });

    // ============================== Value ===============================
    const [mergedValue, setMergedValue] = useControlledState(
      defaultValue || '',
      computed(() => customValue),
    );

    // ============================== Change ==============================
    const triggerChange = (currentValue: string) => {
      setMergedValue(currentValue);
      onChange?.(currentValue);
    };

    // ============================== Reset ===============================
    const handleReset = () => {
      triggerChange('');
    };

    return () => (
      <BaseInput
        suffix={suffix}
        prefixCls={prefixCls}
        value={mergedValue.value}
        allowClear={allowClear}
        handleReset={handleReset}
        class={clsx(prefixCls, className, {
          // hasSuffix
          [`${prefixCls}-has-suffix`]: hasSuffix.value,
        })}
        classNames={mentionsClassNames}
        disabled={disabled}
        ref={holderRef}
        onClear={onClear}
      >
        <InternalMentions
          class={mentionsClassNames?.mentions}
          styles={styles}
          classNames={mentionsClassNames}
          prefixCls={prefixCls}
          id={id}
          ref={mentionRef}
          onChange={triggerChange}
          disabled={disabled}
          hasWrapper={hasSuffix.value}
          {...rest}
        />
      </BaseInput>
    );
  },
);

Mentions.Option = Option;

export default Mentions;
