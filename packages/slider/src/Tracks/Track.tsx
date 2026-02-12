import { clsx } from 'clsx';
import { computed, defineComponent, type CSSProperties } from 'vue';
import { useSliderContextInject } from '../context';
import type { OnStartMove } from '../interface';
import { getOffset } from '../util';

export interface TrackProps {
  prefixCls: string;
  style?: CSSProperties;
  /** Replace with origin prefix concat className */
  replaceCls?: string;
  start: number;
  end: number;
  index: number;
  onStartMove?: OnStartMove;
}

const Track = defineComponent(
  ({ prefixCls, style, start, end, index, onStartMove, replaceCls }: TrackProps) => {
    const { direction, min, max, disabled, range, classNames } = $(useSliderContextInject());

    const trackPrefixCls = computed(() => `${prefixCls}-track`);

    const offsetStart = computed(() => getOffset(start, min, max));
    const offsetEnd = computed(() => getOffset(end, min, max));

    // ============================ Events ============================
    const onInternalStartMove = (e) => {
      if (!disabled && onStartMove) {
        onStartMove(e, -1);
      }
    };

    // ============================ Render ============================
    const positionStyle = computed(() => {
      const result: CSSProperties = {};

      switch (direction) {
        case 'rtl':
          result.right = `${offsetStart.value * 100}%`;
          result.width = `${offsetEnd.value * 100 - offsetStart.value * 100}%`;
          break;

        case 'btt':
          result.bottom = `${offsetStart.value * 100}%`;
          result.height = `${offsetEnd.value * 100 - offsetStart.value * 100}%`;
          break;

        case 'ttb':
          result.top = `${offsetStart.value * 100}%`;
          result.height = `${offsetEnd.value * 100 - offsetStart.value * 100}%`;
          break;

        default:
          result.left = `${offsetStart.value * 100}%`;
          result.width = `${offsetEnd.value * 100 - offsetStart.value * 100}%`;
      }
      return result;
    });

    const className = computed(
      () =>
        replaceCls ||
        clsx(
          trackPrefixCls.value,
          {
            [`${trackPrefixCls.value}-${index + 1}`]: index !== null && range,
            [`${prefixCls}-track-draggable`]: onStartMove,
          },
          classNames.track,
        ),
    );

    return () => (
      <div
        class={className.value}
        style={{ ...positionStyle.value, ...style }}
        onMousedown={onInternalStartMove}
        onTouchstart_passive={onInternalStartMove}
      />
    );
  },
  { inheritAttrs: false },
);

export default Track;
