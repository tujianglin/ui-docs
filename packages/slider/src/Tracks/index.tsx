import { clsx } from 'clsx';
import { computed, defineComponent, type CSSProperties } from 'vue';
import { useSliderContextInject } from '../context';
import type { OnStartMove } from '../interface';
import { getIndex } from '../util';
import Track from './Track';

export interface TrackProps {
  prefixCls: string;
  style?: CSSProperties | CSSProperties[];
  values: number[];
  onStartMove?: OnStartMove;
  startPoint?: number;
}

const Tracks = defineComponent(
  ({ prefixCls, style, values, startPoint, onStartMove }: TrackProps) => {
    const { included, range, min, styles, classNames } = $(useSliderContextInject());

    // =========================== List ===========================
    const trackList = computed(() => {
      if (!range) {
        // null value do not have track
        if (values.length === 0) {
          return [];
        }

        const startValue = startPoint ?? min;
        const endValue = values[0];

        return [{ start: Math.min(startValue, endValue), end: Math.max(startValue, endValue) }];
      }

      // Multiple
      const list: { start: number; end: number }[] = [];

      for (let i = 0; i < values.length - 1; i += 1) {
        list.push({ start: values[i], end: values[i + 1] });
      }

      return list;
    });

    // ========================== Render ==========================

    return () => {
      if (!included) {
        return null;
      }
      return (
        <>
          <Track
            v-if={trackList.value?.length && (classNames.tracks || styles.tracks)}
            index={null}
            prefixCls={prefixCls}
            start={trackList.value[0].start}
            end={trackList.value[trackList.value.length - 1].end}
            replaceCls={clsx(classNames.tracks, `${prefixCls}-tracks`)}
            style={styles.tracks}
          />
          {trackList.value.map(({ start, end }, index) => (
            <Track
              index={index}
              prefixCls={prefixCls}
              style={{ ...getIndex(style, index), ...styles.track }}
              start={start}
              end={end}
              key={index}
              onStartMove={onStartMove}
            />
          ))}
        </>
      );
    };
  },
  { inheritAttrs: false },
);

export default Tracks;
