import KeyCode from '@vc-com/util/lib/KeyCode';
import { clsx } from 'clsx';
import { computed, defineComponent, getCurrentInstance, type ComponentInstance } from 'vue';
import {
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type MouseEvent,
} from 'vue-jsx-vapor';
import type { RenderNode, VueNode } from '../../../util/src/types';
import { useSliderContextInject } from '../context';
import type { OnStartMove } from '../interface';
import { getDirectionStyle, getIndex } from '../util';

interface RenderProps {
  index: number;
  prefixCls: string;
  value: number;
  dragging: boolean;
  draggingDelete: boolean;
}

export interface HandleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onFocus' | 'onMouseenter'> {
  prefixCls: string;
  style?: CSSProperties;
  value: number;
  valueIndex: number;
  dragging: boolean;
  draggingDelete: boolean;
  onStartMove: OnStartMove;
  onDelete?: (index: number) => void;
  onOffsetChange: (value: number | 'min' | 'max', valueIndex: number) => void;
  onFocus: (e: FocusEvent<HTMLDivElement>, index: number) => void;
  onMouseEnter: (e: MouseEvent<HTMLDivElement>, index: number) => void;
  render?: (origin: RenderNode, props: RenderProps) => VueNode;
  onChangeComplete?: () => void;
  mock?: boolean;
}

const Handle = defineComponent(
  ({
    prefixCls,
    value,
    valueIndex,
    onStartMove,
    onDelete,
    style,
    render,
    dragging,
    draggingDelete,
    onOffsetChange,
    onChangeComplete,
    onFocus,
    onMouseEnter,
    ...restProps
  }: HandleProps) => {
    const {
      min,
      max,
      direction,
      disabled,
      keyboard,
      range,
      tabIndex,
      ariaLabelForHandle,
      ariaLabelledByForHandle,
      ariaRequired,
      ariaValueTextFormatterForHandle,
      styles,
      classNames,
    } = $(useSliderContextInject());

    const handlePrefixCls = computed(() => `${prefixCls}-handle`);

    // ============================ Events ============================
    const onInternalStartMove = (e) => {
      if (!disabled) {
        onStartMove(e, valueIndex);
      }
    };

    const onInternalFocus = (e: FocusEvent<HTMLDivElement>) => {
      onFocus?.(e, valueIndex);
    };

    const onInternalMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
      onMouseEnter(e, valueIndex);
    };

    // =========================== Keyboard ===========================
    const onKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
      if (!disabled && keyboard) {
        let offset: number | 'min' | 'max' = null;

        // Change the value
        switch (e.which || e.keyCode) {
          case KeyCode.LEFT:
            offset = direction === 'ltr' || direction === 'btt' ? -1 : 1;
            break;

          case KeyCode.RIGHT:
            offset = direction === 'ltr' || direction === 'btt' ? 1 : -1;
            break;

          // Up is plus
          case KeyCode.UP:
            offset = direction !== 'ttb' ? 1 : -1;
            break;

          // Down is minus
          case KeyCode.DOWN:
            offset = direction !== 'ttb' ? -1 : 1;
            break;

          case KeyCode.HOME:
            offset = 'min';
            break;

          case KeyCode.END:
            offset = 'max';
            break;

          case KeyCode.PAGE_UP:
            offset = 2;
            break;

          case KeyCode.PAGE_DOWN:
            offset = -2;
            break;

          case KeyCode.BACKSPACE:
          case KeyCode.DELETE:
            onDelete?.(valueIndex);
            break;
        }

        if (offset !== null) {
          e.preventDefault();
          onOffsetChange(offset, valueIndex);
        }
      }
    };

    const handleKeyUp: KeyboardEventHandler<Element> = (e) => {
      switch (e.which || e.keyCode) {
        case KeyCode.LEFT:
        case KeyCode.RIGHT:
        case KeyCode.UP:
        case KeyCode.DOWN:
        case KeyCode.HOME:
        case KeyCode.END:
        case KeyCode.PAGE_UP:
        case KeyCode.PAGE_DOWN:
          onChangeComplete?.();
          break;
      }
    };

    // ============================ Offset ============================
    const positionStyle = computed(() => getDirectionStyle(direction, value, min, max));

    const vm = getCurrentInstance();

    const changeRef = (el) => {
      vm.exposed = el || {};
      vm.exposeProxy = el || {};
    };

    defineExpose({} as ComponentInstance<HTMLAttributes>);

    // ============================ Render ============================
    return () => {
      let divProps = {};

      if (valueIndex !== null) {
        divProps = {
          tabindex: disabled ? null : getIndex(tabIndex, valueIndex),
          role: 'slider',
          'aria-valuemin': min,
          'aria-valuemax': max,
          'aria-valuenow': value,
          'aria-disabled': disabled,
          'aria-label': getIndex(ariaLabelForHandle, valueIndex),
          'aria-labelledby': getIndex(ariaLabelledByForHandle, valueIndex),
          'aria-required': getIndex(ariaRequired, valueIndex),
          'aria-valuetext': getIndex(ariaValueTextFormatterForHandle, valueIndex)?.(value),
          'aria-orientation': direction === 'ltr' || direction === 'rtl' ? 'horizontal' : 'vertical',
          onMousedown: onInternalStartMove,
          onTouchstartPassive: onInternalStartMove,
          onFocus: onInternalFocus,
          onMouseenter: onInternalMouseEnter,
          onKeydown: onKeyDown,
          onKeyup: handleKeyUp,
        };
      }

      let handleNode: any = (
        <div
          ref={changeRef}
          class={clsx(
            handlePrefixCls.value,
            {
              [`${handlePrefixCls.value}-${valueIndex + 1}`]: valueIndex !== null && range,
              [`${handlePrefixCls.value}-dragging`]: dragging,
              [`${handlePrefixCls.value}-dragging-delete`]: draggingDelete,
            },
            classNames.handle,
          )}
          style={{ ...positionStyle.value, ...style, ...styles.handle }}
          {...divProps}
          {...restProps}
        />
      );

      // Customize
      if (render) {
        handleNode = render(handleNode, {
          index: valueIndex,
          prefixCls,
          value,
          dragging,
          draggingDelete,
        });
      }

      return handleNode;
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'Handle' : undefined },
);

export default Handle;
