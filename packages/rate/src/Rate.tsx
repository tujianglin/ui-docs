import useControlledState from '@vc-com/util/lib/hooks/useControlledState';
import KeyCode from '@vc-com/util/lib/KeyCode';
import pickAttrs from '@vc-com/util/lib/pickAttrs';
import { clsx } from 'clsx';
import { computed, defineComponent, onMounted, ref, type CSSProperties } from 'vue';
import { useRef, type KeyboardEventHandler, type MouseEvent, type MouseEventHandler } from 'vue-jsx-vapor';
import type { StarProps } from './Star';
import Star from './Star';
import useRefs from './useRefs';
import { getOffsetLeft } from './util';

export interface RateProps extends Pick<StarProps, 'count' | 'character' | 'characterRender' | 'allowHalf' | 'disabled'> {
  value?: number;
  defaultValue?: number;
  allowClear?: boolean;
  style?: CSSProperties;
  prefixCls?: string;
  onChange?: (value: number) => void;
  onHoverChange?: (value: number) => void;
  class?: string;
  tabindex?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeydown?: KeyboardEventHandler<HTMLUListElement>;
  onMouseenter?: MouseEventHandler<HTMLUListElement>;
  onMouseleave?: MouseEventHandler<HTMLUListElement>;
  id?: string;
  autofocus?: boolean;
  direction?: string;
  /**
   * Is keyboard control enabled.
   * @default true
   */
  keyboard?: boolean;
}

export interface RateRef {
  focus: VoidFunction;
  blur: VoidFunction;
}

const Rate = defineComponent(
  ({
    // Base
    prefixCls = 'rc-rate',
    class: className,

    // Value
    defaultValue,
    value: propValue,
    count = 5,
    allowHalf = false,
    allowClear = true,
    keyboard = true,

    // Display
    character: _character,
    characterRender,

    // Meta
    disabled,
    direction = 'ltr',
    tabindex = 0,
    autofocus,

    // Events
    onHoverChange,
    onChange,
    onFocus,
    onBlur,
    onKeydown,
    onMouseleave,

    ...restProps
  }: RateProps) => {
    const character = computed(() => _character || '★');
    const [setStarRef, starRefs] = useRefs();
    const rateRef = useRef<HTMLUListElement>(null);

    // ============================ Ref =============================
    const triggerFocus = () => {
      if (!disabled) {
        rateRef.value?.focus();
      }
    };

    defineExpose({
      focus: triggerFocus,
      blur: () => {
        if (!disabled) {
          rateRef.value?.blur();
        }
      },
    });

    // =========================== Value ============================
    const [value, setValue] = useControlledState(
      defaultValue || 0,
      computed(() => propValue),
    );
    const [cleanedValue, setCleanedValue] = useControlledState<number | null>(
      null,
      computed(() => null),
    );

    const getStarValue = (index: number, x: number) => {
      const reverse = direction === 'rtl';
      let starValue = index + 1;
      if (allowHalf) {
        const starEle = starRefs.value.get(index);
        const leftDis = getOffsetLeft(starEle);
        const width = starEle.clientWidth;
        if (reverse && x - leftDis > width / 2) {
          starValue -= 0.5;
        } else if (!reverse && x - leftDis < width / 2) {
          starValue -= 0.5;
        }
      }
      return starValue;
    };

    // >>>>> Change
    const changeValue = (nextValue: number) => {
      setValue(nextValue);
      onChange?.(nextValue);
    };

    // =========================== Focus ============================
    const focused = ref(false);

    const onInternalFocus = () => {
      focused.value = true;
      onFocus?.();
    };

    const onInternalBlur = () => {
      focused.value = false;
      onBlur?.();
    };

    // =========================== Hover ============================
    const hoverValue = ref<number | null>(null);

    const onHover = (event: MouseEvent<HTMLDivElement>, index: number) => {
      const nextHoverValue = getStarValue(index, event.pageX);
      if (nextHoverValue !== cleanedValue.value) {
        hoverValue.value = nextHoverValue;
        setCleanedValue(null);
      }
      onHoverChange?.(nextHoverValue);
    };

    const onMouseLeaveCallback = (event?: MouseEvent<HTMLUListElement>) => {
      if (!disabled) {
        hoverValue.value = null;
        setCleanedValue(null);
        onHoverChange?.(undefined);
      }
      if (event) {
        onMouseleave?.(event);
      }
    };

    // =========================== Click ============================
    const onClick = (event: MouseEvent | KeyboardEvent, index: number) => {
      const newValue = getStarValue(index, (event as MouseEvent).pageX);
      let isReset = false;
      if (allowClear) {
        isReset = newValue === value.value;
      }
      onMouseLeaveCallback();
      changeValue(isReset ? 0 : newValue);
      setCleanedValue(isReset ? newValue : null);
    };

    const onInternalKeyDown: KeyboardEventHandler<HTMLUListElement> = (event) => {
      const { keyCode } = event;
      const reverse = direction === 'rtl';
      const step = allowHalf ? 0.5 : 1;

      if (keyboard) {
        if (keyCode === KeyCode.RIGHT && value.value < count && !reverse) {
          changeValue(value.value + step);
          event.preventDefault();
        } else if (keyCode === KeyCode.LEFT && value.value > 0 && !reverse) {
          changeValue(value.value - step);
          event.preventDefault();
        } else if (keyCode === KeyCode.RIGHT && value.value > 0 && reverse) {
          changeValue(value.value - step);
          event.preventDefault();
        } else if (keyCode === KeyCode.LEFT && value.value < count && reverse) {
          changeValue(value.value + step);
          event.preventDefault();
        }
      }

      onKeydown?.(event);
    };

    // =========================== Effect ===========================

    onMounted(() => {
      if (autofocus && !disabled) {
        triggerFocus();
      }
    });

    // =========================== Render ===========================
    return () => {
      // >>> Star
      // oxlint-disable-next-line no-new-array
      const starNodes = new Array(count)
        .fill(0)
        .map((item, index) => (
          <Star
            ref={setStarRef(index)}
            index={index}
            count={count}
            disabled={disabled}
            prefixCls={`${prefixCls}-star`}
            allowHalf={allowHalf}
            value={hoverValue.value === null ? value.value : hoverValue.value}
            onClick={onClick}
            onHover={onHover}
            key={item || index}
            character={character.value}
            characterRender={characterRender}
            focused={focused.value}
          />
        ));

      const classString = clsx(prefixCls, className, {
        [`${prefixCls}-disabled`]: disabled,
        [`${prefixCls}-rtl`]: direction === 'rtl',
      });

      // >>> Node
      return (
        <ul
          class={classString}
          onMouseleave={onMouseLeaveCallback}
          tabindex={disabled ? -1 : tabindex}
          onFocus={disabled ? null : onInternalFocus}
          onBlur={disabled ? null : onInternalBlur}
          onKeydown={disabled ? null : onInternalKeyDown}
          ref={rateRef}
          {...pickAttrs(restProps, { aria: true, data: true, attr: true })}
        >
          {starNodes}
        </ul>
      );
    };
  },
  { inheritAttrs: false },
);

export default Rate;
