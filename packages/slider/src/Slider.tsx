import isEqual from '@vc-com/util/lib/isEqual';
import { warning } from '@vc-com/util/lib/warning';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent, isVNode, onMounted, ref, watch, type CSSProperties } from 'vue';
import { useRef, type FocusEvent, type MouseEvent } from 'vue-jsx-vapor';
import type { RenderNode } from '../../util/src/types';
import type { HandlesProps, HandlesRef } from './Handles';
import Handles from './Handles';
import type { InternalMarkObj, MarkObj } from './Marks';
import Marks from './Marks';
import Steps from './Steps';
import Tracks from './Tracks';
import { SliderContextProvider, type SliderContextProps } from './context';
import useDrag from './hooks/useDrag';
import useOffset from './hooks/useOffset';
import useRange from './hooks/useRange';
import type { AriaValueFormat, Direction, OnStartMove, SliderClassNames, SliderStyles } from './interface';

/**
 * New:
 * - click mark to update range value
 * - handleRender
 * - Fix handle with count not correct
 * - Fix pushable not work in some case
 * - No more FindDOMNode
 * - Move all position related style into inline style
 * - Key: up is plus, down is minus
 * - fix Key with step = null not align with marks
 * - Change range should not trigger onChange
 * - keyboard support pushable
 */

export type RangeConfig = {
  editable?: boolean;
  draggableTrack?: boolean;
  /** Set min count when `editable` */
  minCount?: number;
  /** Set max count when `editable` */
  maxCount?: number;
};

export interface SliderProps<ValueType = number | number[]> {
  prefixCls?: string;
  class?: string;
  style?: CSSProperties;

  classNames?: SliderClassNames;
  styles?: SliderStyles;

  id?: string;

  // Status
  disabled?: boolean;
  keyboard?: boolean;
  autoFocus?: boolean;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;

  // Value
  range?: boolean | RangeConfig;
  min?: number;
  max?: number;
  step?: number | null;
  onChange?: (value: ValueType) => void;
  onChangeComplete?: (value: ValueType) => void;

  // Cross
  allowCross?: boolean;
  pushable?: boolean | number;

  // Direction
  reverse?: boolean;
  vertical?: boolean;

  // Style
  included?: boolean;
  startPoint?: number;
  dotStyle?: CSSProperties | ((dotValue: number) => CSSProperties);
  activeDotStyle?: CSSProperties | ((dotValue: number) => CSSProperties);

  // Decorations
  marks?: Record<string | number, RenderNode | MarkObj>;
  dots?: boolean;

  // Components
  handleRender?: HandlesProps['handleRender'];
  activeHandleRender?: HandlesProps['handleRender'];
  track?: boolean;

  // Accessibility
  tabIndex?: number | number[];
  ariaLabelForHandle?: string | string[];
  ariaLabelledByForHandle?: string | string[];
  ariaRequired?: boolean;
  ariaValueTextFormatterForHandle?: AriaValueFormat | AriaValueFormat[];
}

export interface SliderRef {
  focus: () => void;
  blur: () => void;
}

const Slider = defineComponent(
  ({
    prefixCls = 'rc-slider',
    class: className,
    style,
    classNames,
    styles,

    id,

    // Status
    disabled = false,
    keyboard = true,
    autoFocus,
    onFocus,
    onBlur,

    // Value
    min = 0,
    max = 100,
    step = 1,
    range,
    onChange,
    onChangeComplete,

    // Cross
    allowCross = true,
    pushable = false,

    // Direction
    reverse,
    vertical,

    // Style
    included = true,
    startPoint,
    dotStyle,
    activeDotStyle,

    // Decorations
    marks,
    dots,

    // Components
    handleRender,
    activeHandleRender,
    track,

    // Accessibility
    tabIndex = 0,
    ariaLabelForHandle,
    ariaLabelledByForHandle,
    ariaRequired,
    ariaValueTextFormatterForHandle,
  }: SliderProps<number | number[]>) => {
    const handlesRef = useRef<HandlesRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const direction = computed<Direction>(() => {
      if (vertical) {
        return reverse ? 'ttb' : 'btt';
      }
      return reverse ? 'rtl' : 'ltr';
    });

    // ============================ Range =============================
    const { rangeEnabled, rangeEditable, rangeDraggableTrack, minCount, maxCount } = $(useRange(computed(() => range)));

    const mergedMin = computed(() => (isFinite(min) ? min : 0));
    const mergedMax = computed(() => (isFinite(max) ? max : 100));

    // ============================= Step =============================
    const mergedStep = computed(() => (step !== null && step <= 0 ? 1 : step));

    // ============================= Push =============================
    const mergedPush = computed(() => {
      if (typeof pushable === 'boolean') {
        return pushable ? mergedStep.value : false;
      }
      return pushable >= 0 ? pushable : false;
    });

    // ============================ Marks =============================
    const markList = computed<InternalMarkObj[]>(() => {
      return Object.keys(marks || {})
        .map<InternalMarkObj>((key) => {
          const mark = marks[key];
          const markObj: InternalMarkObj = {
            value: Number(key),
          };

          if (mark && typeof mark === 'object' && !isVNode(mark) && ('label' in mark || 'style' in mark)) {
            markObj.style = mark.style;
            markObj.label = mark.label;
          } else {
            markObj.label = mark as RenderNode;
          }

          return markObj;
        })
        .filter(({ label }) => label || typeof label === 'number')
        .sort((a, b) => a.value - b.value);
    });

    // ============================ Format ============================
    const [formatValue, offsetValues] = useOffset(
      mergedMin,
      mergedMax,
      mergedStep,
      markList,
      computed(() => allowCross),
      mergedPush,
    );

    // ============================ Values ============================
    const mergedValue = defineModel<number | number[]>('value');

    const rawValues = computed(() => {
      const valueList =
        mergedValue.value === null || mergedValue.value === undefined
          ? []
          : Array.isArray(mergedValue.value)
            ? mergedValue.value
            : [mergedValue.value];

      const [val0 = mergedMin.value] = valueList;
      let returnValues = mergedValue.value === null ? [] : [val0];

      // Format as range
      if (rangeEnabled) {
        returnValues = [...valueList];

        returnValues.sort((a, b) => a - b);
      }

      // Align in range
      returnValues.forEach((val, index) => {
        returnValues[index] = formatValue(val);
      });

      return returnValues;
    });

    // =========================== onChange ===========================
    const getTriggerValue = (triggerValues: number[]) => (rangeEnabled ? triggerValues : triggerValues[0]);

    const triggerChange = (nextValues: number[]) => {
      // Order first
      const cloneNextValues = [...nextValues].sort((a, b) => a - b);

      // Trigger event if needed
      if (onChange && !isEqual(cloneNextValues, rawValues.value, true)) {
        onChange(getTriggerValue(cloneNextValues));
      }

      // We set this later since it will re-render component immediately
      mergedValue.value = cloneNextValues;
    };

    const finishChange = (draggingDelete?: boolean) => {
      // Trigger from `useDrag` will tell if it's a delete action
      if (draggingDelete) {
        handlesRef.value.hideHelp();
      }

      const finishValue = getTriggerValue(rawValues.value);
      onChangeComplete?.(finishValue);
    };

    const onDelete = (index: number) => {
      if (disabled || !rangeEditable || rawValues.value.length <= minCount) {
        return;
      }

      const cloneNextValues = [...rawValues.value];
      cloneNextValues.splice(index, 1);

      triggerChange(cloneNextValues);

      const nextFocusIndex = Math.max(0, index - 1);
      handlesRef.value.hideHelp();
      handlesRef.value?.focus(nextFocusIndex);
    };

    const [draggingIndex, draggingValue, draggingDelete, cacheValues, onStartDrag] = useDrag(
      containerRef,
      direction,
      rawValues,
      mergedMin,
      mergedMax,
      formatValue,
      triggerChange,
      finishChange,
      offsetValues,
      computed(() => rangeEditable),
      computed(() => minCount),
    );

    /**
     * When `rangeEditable` will insert a new value in the values array.
     * Else it will replace the value in the values array.
     */
    const changeToCloseValue = (newValue: number, e?) => {
      if (!disabled) {
        // Create new values
        const cloneNextValues = [...rawValues.value];

        let valueIndex = 0;
        let valueBeforeIndex = 0; // Record the index which value < newValue
        let valueDist = mergedMax.value - mergedMin.value;

        rawValues.value.forEach((val, index) => {
          const dist = Math.abs(newValue - val);
          if (dist <= valueDist) {
            valueDist = dist;
            valueIndex = index;
          }

          if (val < newValue) {
            valueBeforeIndex = index;
          }
        });

        let focusIndex = valueIndex;

        if (rangeEditable && valueDist !== 0 && (!maxCount || rawValues.value.length < maxCount)) {
          cloneNextValues.splice(valueBeforeIndex + 1, 0, newValue);
          focusIndex = valueBeforeIndex + 1;
        } else {
          cloneNextValues[valueIndex] = newValue;
        }

        // Fill value to match default 2 (only when `rawValues` is empty)
        if (rangeEnabled && !rawValues.value.length) {
          cloneNextValues.push(newValue);
        }

        const nextValue = getTriggerValue(cloneNextValues);
        triggerChange(cloneNextValues);

        if (e) {
          (document.activeElement as HTMLElement)?.blur?.();
          handlesRef.value?.focus(focusIndex);
          onStartDrag(e, focusIndex, cloneNextValues);
        } else {
          // https://github.com/ant-design/ant-design/issues/49997
          onChangeComplete?.(nextValue);
        }
      }
    };

    // ============================ Click =============================
    const onSliderMouseDown = (e: MouseEvent) => {
      e.preventDefault();

      const { width, height, left, top, bottom, right } = containerRef.value.getBoundingClientRect();
      const { clientX, clientY } = e;

      let percent: number;
      switch (direction.value) {
        case 'btt':
          percent = (bottom - clientY) / height;
          break;

        case 'ttb':
          percent = (clientY - top) / height;
          break;

        case 'rtl':
          percent = (right - clientX) / width;
          break;

        default:
          percent = (clientX - left) / width;
      }

      const nextValue = mergedMin.value + percent * (mergedMax.value - mergedMin.value);
      changeToCloseValue(formatValue(nextValue), e);
    };

    // =========================== Keyboard ===========================
    const keyboardValue = ref<number>(null);

    const onHandleOffsetChange = (offset: number | 'min' | 'max', valueIndex: number) => {
      if (!disabled) {
        const next = offsetValues(rawValues.value, offset, valueIndex);

        triggerChange(next.values);

        keyboardValue.value = next.value;
      }
    };

    watch(
      keyboardValue,
      () => {
        if (keyboardValue.value !== null) {
          const valueIndex = rawValues.value.indexOf(keyboardValue.value);
          if (valueIndex >= 0) {
            handlesRef.value?.focus(valueIndex);
          }
        }

        keyboardValue.value = null;
      },
      { immediate: true, deep: true },
    );

    // ============================= Drag =============================
    const mergedDraggableTrack = computed(() => {
      if (rangeDraggableTrack && mergedStep.value === null) {
        if (process.env.NODE_ENV !== 'production') {
          warning(false, '`draggableTrack` is not supported when `step` is `null`.');
        }
        return false;
      }
      return rangeDraggableTrack;
    });

    const onStartMove: OnStartMove = (e, valueIndex) => {
      onStartDrag(e, valueIndex);
    };

    // Auto focus for updated handle
    const dragging = computed(() => draggingIndex.value !== -1);
    watch(
      dragging,
      () => {
        if (!dragging.value) {
          const valueIndex = rawValues.value.lastIndexOf(draggingValue.value);
          handlesRef.value?.focus(valueIndex);
        }
      },
      { immediate: true },
    );

    // =========================== Included ===========================
    const sortedCacheValues = computed(() => [...cacheValues.value].sort((a, b) => a - b));

    // Provide a range values with included [min, max]
    // Used for Track, Mark & Dot
    const { includedStart, includedEnd } = $(
      reactiveComputed(() => {
        if (!rangeEnabled) {
          return {
            includedStart: mergedMin.value,
            includedEnd: sortedCacheValues.value[0],
          };
        }
        return {
          includedStart: sortedCacheValues.value[0],
          includedEnd: sortedCacheValues.value[sortedCacheValues.value.length - 1],
        };
      }),
    );

    // ============================= Refs =============================
    defineExpose({
      focus: () => {
        handlesRef.value?.focus(0);
      },
      blur: () => {
        const { activeElement } = document;
        if (containerRef.value?.contains(activeElement)) {
          (activeElement as HTMLElement)?.blur();
        }
      },
    });

    // ========================== Auto Focus ==========================
    onMounted(() => {
      if (autoFocus) {
        handlesRef.value?.focus(0);
      }
    });

    // =========================== Context ============================
    const context = computed<SliderContextProps>(() => ({
      min: mergedMin.value,
      max: mergedMax.value,
      direction: direction.value,
      disabled,
      keyboard,
      step: mergedStep.value,
      included,
      includedStart,
      includedEnd,
      range: rangeEnabled,
      tabIndex,
      ariaLabelForHandle,
      ariaLabelledByForHandle,
      ariaRequired,
      ariaValueTextFormatterForHandle,
      styles: styles || {},
      classNames: classNames || {},
    }));

    // ============================ Render ============================
    return () => (
      <SliderContextProvider value={context.value}>
        <div
          ref={containerRef}
          class={clsx(prefixCls, className, {
            [`${prefixCls}-disabled`]: disabled,
            [`${prefixCls}-vertical`]: vertical,
            [`${prefixCls}-horizontal`]: !vertical,
            [`${prefixCls}-with-marks`]: markList.value.length,
          })}
          style={style}
          onMousedown={onSliderMouseDown}
          id={id}
        >
          <div class={clsx(`${prefixCls}-rail`, classNames?.rail)} style={styles?.rail} />

          <Tracks
            v-if={track !== false}
            prefixCls={prefixCls}
            style={styles?.tracks}
            values={rawValues.value}
            startPoint={startPoint}
            onStartMove={mergedDraggableTrack.value ? onStartMove : undefined}
          />

          <Steps prefixCls={prefixCls} marks={markList.value} dots={dots} style={dotStyle} activeStyle={activeDotStyle} />

          <Handles
            ref={handlesRef}
            prefixCls={prefixCls}
            style={styles?.handle}
            values={cacheValues.value}
            draggingIndex={draggingIndex.value}
            draggingDelete={draggingDelete.value}
            onStartMove={onStartMove}
            onOffsetChange={onHandleOffsetChange}
            onFocus={onFocus}
            onBlur={onBlur}
            handleRender={handleRender}
            activeHandleRender={activeHandleRender}
            onChangeComplete={finishChange}
            onDelete={rangeEditable ? onDelete : undefined}
          />

          <Marks prefixCls={prefixCls} marks={markList.value} onClick={changeToCloseValue} />
        </div>
      </SliderContextProvider>
    );
  },
);

if (process.env.NODE_ENV !== 'production') {
  Slider.displayName = 'Slider';
}

export default Slider;
