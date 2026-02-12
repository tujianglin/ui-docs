import { computed, defineComponent, nextTick, ref, type CSSProperties } from 'vue';
import type { FocusEvent, MouseEvent } from 'vue-jsx-vapor';
import type { OnStartMove } from '../interface';
import { getIndex } from '../util';
import type { HandleProps } from './Handle';
import Handle from './Handle';

export interface HandlesProps {
  prefixCls: string;
  style?: CSSProperties | CSSProperties[];
  values: number[];
  onStartMove: OnStartMove;
  onOffsetChange: (value: number | 'min' | 'max', valueIndex: number) => void;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
  onDelete?: (index: number) => void;
  handleRender?: HandleProps['render'];
  /**
   * When config `activeHandleRender`,
   * it will render another hidden handle for active usage.
   * This is useful for accessibility or tooltip usage.
   */
  activeHandleRender?: HandleProps['render'];
  draggingIndex: number;
  draggingDelete: boolean;
  onChangeComplete?: () => void;
}

export interface HandlesRef {
  focus: (index: number) => void;
  hideHelp: VoidFunction;
}

const Handles = defineComponent(
  ({
    prefixCls,
    style,
    onStartMove,
    onOffsetChange,
    values,
    handleRender,
    activeHandleRender,
    draggingIndex,
    draggingDelete,
    onFocus,
    ...restProps
  }: HandlesProps) => {
    const handlesRef = ref<Record<number, HTMLDivElement>>({});

    // =========================== Active ===========================
    const activeVisible = ref(false);
    const activeIndex = ref(-1);

    const onActive = (index: number) => {
      activeIndex.value = index;
      activeVisible.value = true;
    };

    const onHandleFocus = (e: FocusEvent, index: number) => {
      onActive(index);
      onFocus?.(e);
    };

    const onHandleMouseEnter = (_: MouseEvent, index: number) => {
      onActive(index);
    };

    // =========================== Render ===========================
    defineExpose({
      focus: (index: number) => {
        handlesRef.value[index]?.focus();
      },
      hideHelp: () => {
        nextTick(() => {
          activeVisible.value = false;
        });
      },
    });

    // =========================== Render ===========================
    // Handle Props
    const handleProps = computed(() => ({
      prefixCls,
      onStartMove,
      onOffsetChange,
      render: handleRender,
      onFocus: onHandleFocus,
      onMouseEnter: onHandleMouseEnter,
      ...restProps,
    }));

    return () => (
      <>
        <Handle
          v-for={(value, index) in values}
          ref={(node) => {
            if (!node) {
              delete handlesRef.value[index];
            } else {
              handlesRef.value[index] = node as any;
            }
          }}
          dragging={draggingIndex === index}
          draggingDelete={draggingIndex === index && draggingDelete}
          style={getIndex(style, index)}
          key={index}
          value={value}
          valueIndex={index}
          {...handleProps.value}
        />
        {/* Used for render tooltip, this is not a real handle */}
        <Handle
          v-if={activeHandleRender && activeVisible}
          key="a11y"
          {...handleProps.value}
          value={values[activeIndex.value]}
          valueIndex={null}
          dragging={draggingIndex !== -1}
          draggingDelete={draggingDelete}
          render={activeHandleRender}
          style={{ pointerEvents: 'none' }}
          tabindex={null}
          aria-hidden
        />
      </>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'Handles' : undefined },
);

export default Handles;
