import Portal from '@vc-com/portal';
import { useId } from '@vc-com/util/lib/hooks/useId';
import { clsx } from 'clsx';
import { defineComponent, type CSSProperties } from 'vue';
import type { SVGAttributes } from 'vue-jsx-vapor';
import type { PosInfo } from './hooks/useTarget';
import type { SemanticName, TourProps } from './interface';

const COVER_PROPS: SVGAttributes = {
  fill: 'transparent',
  'pointer-events': 'auto',
};

export interface MaskProps {
  prefixCls?: string;
  pos: PosInfo; //	获取引导卡片指向的元素
  rootClass?: string;
  showMask?: boolean;
  style?: CSSProperties;
  // to fill mask color, e.g. rgba(80,0,0,0.5)
  fill?: string;
  open?: boolean;
  animated?: boolean | { placeholder: boolean };
  zIndex?: number;
  disabledInteraction?: boolean;
  classes?: Partial<Record<SemanticName, string>>;
  styles?: Partial<Record<SemanticName, CSSProperties>>;
  getPopupContainer?: TourProps['getPopupContainer'];
  onEsc?: (info: { top: boolean; event: KeyboardEvent }) => void;
}

const Mask = defineComponent(
  ({
    prefixCls,
    rootClass,
    pos,
    showMask,
    style = {},
    fill = 'rgba(0,0,0,0.5)',
    open,
    animated,
    zIndex,
    disabledInteraction,
    styles,
    classes: tourClassNames,
    getPopupContainer,
    onEsc,
  }: MaskProps) => {
    const id = useId();

    return () => {
      const maskId = `${prefixCls}-mask-${id.value}`;
      const mergedAnimated = typeof animated === 'object' ? animated?.placeholder : animated;

      const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const maskRectSize = isSafari ? { width: '100%', height: '100%' } : { width: '100vw', height: '100vh' };

      const inlineMode = getPopupContainer === false;
      return (
        <Portal open={open} autoLock={!inlineMode} getContainer={getPopupContainer as any} onEsc={onEsc}>
          <div
            class={clsx(`${prefixCls}-mask`, rootClass, tourClassNames?.mask)}
            style={{
              position: inlineMode ? 'absolute' : 'fixed',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              zIndex,
              pointerEvents: pos && !disabledInteraction ? 'none' : 'auto',
              ...style,
              ...styles?.mask,
            }}
          >
            {showMask ? (
              <svg style={{ width: '100%', height: '100%' }}>
                <defs>
                  <mask id={maskId}>
                    <rect x="0" y="0" {...maskRectSize} fill="white" />
                    {pos && (
                      <rect
                        x={pos.left}
                        y={pos.top}
                        rx={pos.radius}
                        width={pos.width}
                        height={pos.height}
                        fill="black"
                        class={mergedAnimated ? `${prefixCls}-placeholder-animated` : ''}
                      />
                    )}
                  </mask>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill={fill} mask={`url(#${maskId})`} />

                {/* Block click region */}
                {pos && (
                  <>
                    {/* Top */}

                    <rect {...COVER_PROPS} x="0" y="0" width="100%" height={Math.max(pos.top, 0)} />
                    {/* Left */}
                    <rect {...COVER_PROPS} x="0" y="0" width={Math.max(pos.left, 0)} height="100%" />
                    {/* Bottom */}
                    <rect
                      {...COVER_PROPS}
                      x="0"
                      y={pos.top + pos.height}
                      width="100%"
                      height={`calc(100% - ${pos.top + pos.height}px)`}
                    />
                    {/* Right */}
                    <rect
                      {...COVER_PROPS}
                      x={pos.left + pos.width}
                      y="0"
                      width={`calc(100% - ${pos.left + pos.width}px)`}
                      height="100%"
                    />
                  </>
                )}
              </svg>
            ) : null}
          </div>
        </Portal>
      );
    };
  },
  { inheritAttrs: false },
);

export default Mask;
