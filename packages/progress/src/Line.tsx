import { useId } from '@vc-com/util/lib/hooks/useId';
import { clsx } from 'clsx';
import { computed, defineComponent, type CSSProperties } from 'vue';
import { useTransitionDuration } from './common';
import type { ProgressProps } from './interface';
import getIndeterminateLine from './utils/getIndeterminateLine';

const Line = defineComponent(
  ({
    id,
    class: className,
    percent: _percent,
    prefixCls = 'rc-progress',
    strokeColor: _strokeColor,
    strokeLinecap = 'round',
    strokeWidth = 1,
    style,
    railColor = '#D9D9D9',
    railWidth = 1,
    transition = 'bottom',
    loading = false,
    ...restProps
  }: ProgressProps) => {
    const strokeColor = computed(() => _strokeColor ?? '#2db7f5');
    const percent = computed(() => _percent ?? 0);

    const mergedId = useId(id);
    return () => {
      // eslint-disable-next-line no-param-reassign
      const percentList = Array.isArray(percent.value) ? percent.value : [percent.value];
      const strokeColorList = Array.isArray(strokeColor.value) ? strokeColor.value : [strokeColor.value];

      const paths = useTransitionDuration();

      const center = strokeWidth / 2;
      const right = 100 - strokeWidth / 2;
      const pathString = `M ${strokeLinecap === 'round' ? center : 0},${center}
         L ${strokeLinecap === 'round' ? right : 100},${center}`;
      const viewBoxString = `0 0 100 ${strokeWidth}`;
      let stackPtg = 0;
      const { indeterminateStyleProps, indeterminateStyleAnimation } = getIndeterminateLine({
        id: mergedId.value,
        loading,
        percent: percentList[0],
        strokeLinecap,
        strokeWidth,
      });

      return (
        <svg
          class={clsx(`${prefixCls}-line`, className)}
          viewBox={viewBoxString}
          preserveAspectRatio="none"
          style={style}
          {...restProps}
        >
          <path
            class={`${prefixCls}-line-rail`}
            d={pathString}
            stroke-linecap={strokeLinecap}
            stroke={railColor}
            stroke-width={railWidth || strokeWidth}
            fill-opacity="0"
          />
          {percentList.map((ptg, index) => {
            let dashPercent = 1;
            switch (strokeLinecap) {
              case 'round':
                dashPercent = 1 - strokeWidth / 100;
                break;
              case 'square':
                dashPercent = 1 - strokeWidth / 2 / 100;
                break;
              default:
                dashPercent = 1;
                break;
            }
            const pathStyle: CSSProperties = {
              strokeDasharray: `${ptg * dashPercent}px, 100px`,
              strokeDashoffset: `-${stackPtg}px`,
              transition: transition || 'stroke-dashoffset 0.3s ease 0s, stroke-dasharray .3s ease 0s, stroke 0.3s linear',
              ...indeterminateStyleProps,
            };
            const color = strokeColorList[index] || strokeColorList[strokeColorList.length - 1];
            stackPtg += ptg;
            return (
              <path
                key={index}
                class={`${prefixCls}-line-path`}
                d={pathString}
                stroke-linecap={strokeLinecap}
                stroke={color as string}
                stroke-width={strokeWidth}
                fill-opacity="0"
                ref={(elem) => {
                  // https://reactjs.org/docs/refs-and-the-dom.html#callback-refs
                  // React will call the ref callback with the DOM element when the component mounts,
                  // and call it with `null` when it unmounts.
                  // Refs are guaranteed to be up-to-date before componentDidMount or componentDidUpdate fires.

                  paths[index] = elem;
                }}
                style={pathStyle}
              />
            );
          })}
          {indeterminateStyleAnimation}
        </svg>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'Line' : undefined },
);

export default Line;
