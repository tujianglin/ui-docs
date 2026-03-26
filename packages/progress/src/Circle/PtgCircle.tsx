import { clsx } from 'clsx';
import { computed, defineComponent, type CSSProperties } from 'vue';
import type { ProgressProps } from '..';
import type { StrokeColorObject } from '../interface';

interface BlockProps {
  bg: string;
}

const Block = defineComponent(({ bg }: BlockProps) => {
  return () => (
    <div style={{ width: '100%', height: '100%', background: bg }}>
      <slot></slot>
    </div>
  );
});

function getPtgColors(color: Record<string, string | boolean>, scale: number) {
  return Object.keys(color).map((key) => {
    const parsedKey = parseFloat(key);
    const ptgKey = `${Math.floor(parsedKey * scale)}%`;

    return `${color[key]} ${ptgKey}`;
  });
}

export interface ColorGradientProps {
  prefixCls: string;
  class?: string;
  gradientId: string;
  style: CSSProperties;
  ptg: number;
  radius: number;
  strokeLinecap: ProgressProps['strokeLinecap'];
  strokeWidth: ProgressProps['strokeWidth'];
  size: number;
  color: string | StrokeColorObject;
  gapDegree: number;
}

const PtgCircle = defineComponent(
  ({
    prefixCls,
    color,
    gradientId,
    radius,
    class: className,
    style: circleStyleForStack,
    ptg,
    strokeLinecap,
    strokeWidth,
    size,
    gapDegree,
  }: ColorGradientProps) => {
    const isGradient = computed(() => color && typeof color === 'object');

    const stroke = computed(() => (isGradient.value ? `#FFF` : undefined));

    // ========================== Circle ==========================
    const halfSize = computed(() => size / 2);

    return () => {
      const circleNode = (
        <circle
          class={clsx(`${prefixCls}-circle-path`, className)}
          r={radius}
          cx={halfSize.value}
          cy={halfSize.value}
          stroke={stroke.value}
          stroke-linecap={strokeLinecap}
          stroke-width={strokeWidth}
          opacity={ptg === 0 ? 0 : 1}
          style={circleStyleForStack}
        />
      );

      // ========================== Render ==========================
      if (!isGradient.value) {
        return circleNode;
      }

      const maskId = `${gradientId}-conic`;

      const fromDeg = gapDegree ? `${180 + gapDegree / 2}deg` : '0deg';

      const conicColors = getPtgColors(color as any, (360 - gapDegree) / 360);
      const linearColors = getPtgColors(color as any, 1);

      const conicColorBg = `conic-gradient(from ${fromDeg}, ${conicColors.join(', ')})`;
      const linearColorBg = `linear-gradient(to ${gapDegree ? 'bottom' : 'top'}, ${linearColors.join(', ')})`;

      return (
        <>
          <mask id={maskId}>{circleNode}</mask>
          <foreignObject x={0} y={0} width={size} height={size} mask={`url(#${maskId})`}>
            <Block bg={linearColorBg}>
              <Block bg={conicColorBg} />
            </Block>
          </foreignObject>
        </>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'PtgCircle' : undefined },
);

export default PtgCircle;
