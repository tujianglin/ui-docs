import { useId } from '@vc-com/util/lib/hooks/useId';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent } from 'vue';
import { useTransitionDuration } from '../common';
import type { ProgressProps } from '../interface';
import getIndeterminateCircle from '../utils/getIndeterminateCircle';
import PtgCircle from './PtgCircle';
import { VIEW_BOX_SIZE, getCircleStyle } from './util';

function toArray<T>(value: T | T[]): T[] {
  const mergedValue = value ?? [];
  return Array.isArray(mergedValue) ? mergedValue : [mergedValue];
}

const Circle = defineComponent(
  ({
    id,
    prefixCls = 'rc-progress',
    classNames = {},
    styles = {},
    steps,
    strokeWidth = 1,
    railWidth = 1,
    gapDegree = 0,
    gapPosition = 'bottom',
    railColor = '#D9D9D9',
    strokeLinecap = 'round',
    style,
    class: className,
    strokeColor: _strokeColor,
    percent: _percent,
    loading,
    ...restProps
  }: ProgressProps) => {
    const strokeColor = computed(() => _strokeColor ?? '#2db7f5');
    const percent = computed(() => _percent ?? 0);
    const halfSize = VIEW_BOX_SIZE / 2;

    const mergedId = useId(id);
    const gradientId = computed(() => `${mergedId.value}-gradient`);
    const radius = computed(() => halfSize - strokeWidth / 2);
    const perimeter = computed(() => Math.PI * 2 * radius.value);
    const rotateDeg = computed(() => (gapDegree > 0 ? 90 + gapDegree / 2 : -90));
    const perimeterWithoutGap = computed(() => perimeter.value * ((360 - gapDegree) / 360));
    const { count: stepCount, gap: stepGap } = $(
      reactiveComputed(() => (typeof steps === 'object' ? steps : { count: steps, gap: 2 })),
    );

    const percentList = computed(() => toArray(percent.value));
    const strokeColorList = computed(() => toArray(strokeColor.value));
    const gradient = computed(
      () => strokeColorList.value.find((color) => color && typeof color === 'object') as Record<string, string>,
    );
    const isConicGradient = computed(() => gradient.value && typeof gradient.value === 'object');
    const mergedStrokeLinecap = computed(() => (isConicGradient.value ? 'butt' : strokeLinecap));

    const circleStyle = computed(() =>
      getCircleStyle(
        perimeter.value,
        perimeterWithoutGap.value,
        0,
        100,
        rotateDeg.value,
        gapDegree,
        gapPosition,
        railColor,
        mergedStrokeLinecap.value,
        strokeWidth,
      ),
    );

    return () => {
      const { indeterminateStyleProps, indeterminateStyleAnimation } = getIndeterminateCircle({
        id: mergedId.value,
        loading,
      });
      const paths = useTransitionDuration();

      const getStokeList = () => {
        let stackPtg = 0;
        return percentList.value
          .map((ptg, index) => {
            const color = strokeColorList.value[index] || strokeColorList.value[strokeColorList.value.length - 1];
            const circleStyleForStack = getCircleStyle(
              perimeter.value,
              perimeterWithoutGap.value,
              stackPtg,
              ptg,
              rotateDeg.value,
              gapDegree,
              gapPosition,
              color,
              mergedStrokeLinecap.value,
              strokeWidth,
            );
            stackPtg += ptg;

            return (
              <PtgCircle
                key={index}
                color={color}
                ptg={ptg}
                radius={radius.value}
                prefixCls={prefixCls}
                gradientId={gradientId.value}
                class={classNames.track}
                style={{ ...circleStyleForStack, ...indeterminateStyleProps, ...styles.track }}
                strokeLinecap={mergedStrokeLinecap.value}
                strokeWidth={strokeWidth}
                gapDegree={gapDegree}
                ref={(elem) => {
                  // https://reactjs.org/docs/refs-and-the-dom.html#callback-refs
                  // React will call the ref callback with the DOM element when the component mounts,
                  // and call it with `null` when it unmounts.
                  // Refs are guaranteed to be up-to-date before componentDidMount or componentDidUpdate fires.

                  paths.value[index] = elem as any;
                }}
                size={VIEW_BOX_SIZE}
              />
            );
          })
          .reverse();
      };

      const getStepStokeList = () => {
        // only show the first percent when pass steps
        const current = Math.round(stepCount * (percentList.value[0] / 100));
        const stepPtg = 100 / stepCount;

        let stackPtg = 0;
        // oxlint-disable-next-line no-new-array
        return new Array(stepCount).fill(null).map((_, index) => {
          const color = index <= current - 1 ? strokeColorList.value[0] : railColor;
          const stroke = color && typeof color === 'object' ? `url(#${gradientId.value})` : undefined;
          const circleStyleForStack = getCircleStyle(
            perimeter.value,
            perimeterWithoutGap.value,
            stackPtg,
            stepPtg,
            rotateDeg.value,
            gapDegree,
            gapPosition,
            color,
            'butt',
            strokeWidth,
            stepGap,
          );
          stackPtg +=
            ((perimeterWithoutGap.value - (circleStyleForStack.strokeDashoffset as number) + stepGap) * 100) /
            perimeterWithoutGap.value;

          return (
            <circle
              key={index}
              class={clsx(`${prefixCls}-circle-path`, classNames.track)}
              r={radius.value}
              cx={halfSize}
              cy={halfSize}
              stroke={stroke}
              stroke-width={strokeWidth}
              opacity={1}
              style={{ ...circleStyleForStack, ...styles.track }}
              ref={(elem) => {
                paths.value[index] = elem as any;
              }}
            />
          );
        });
      };
      return (
        <svg
          class={clsx(`${prefixCls}-circle`, classNames.root, className)}
          viewBox={`0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`}
          style={{
            ...styles.root,
            ...style,
          }}
          id={id}
          role="presentation"
          {...restProps}
        >
          <circle
            v-if={!stepCount}
            class={clsx(`${prefixCls}-circle-rail`, classNames.rail)}
            r={radius.value}
            cx={halfSize}
            cy={halfSize}
            stroke={railColor}
            stroke-linecap={mergedStrokeLinecap.value}
            stroke-width={railWidth || strokeWidth}
            style={{ ...circleStyle.value, ...styles.rail }}
          />
          {stepCount ? getStepStokeList() : getStokeList()}
          {indeterminateStyleAnimation}
        </svg>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'Circle' : undefined },
);

export default Circle;
