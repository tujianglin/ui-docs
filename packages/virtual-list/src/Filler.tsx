import ResizeObserver from '@vc-com/resize-observer';
import type { VueNode } from '@vc-com/util/lib/types';
import { resolveVNode } from '@vc-com/util/lib/vnode';
import { clsx } from 'clsx';
import { computed, defineComponent, type CSSProperties } from 'vue';
import { useRef, type HTMLAttributes } from 'vue-jsx-vapor';

export type InnerProps = Pick<HTMLAttributes<HTMLDivElement>, 'role' | 'id'>;

interface FillerProps {
  prefixCls?: string;
  /** Virtual filler height. Should be `count * itemMinHeight` */
  height: number;
  /** Set offset of visible items. Should be the top of start item position */
  offsetY?: number;
  offsetX?: number;

  scrollWidth?: number;

  onInnerResize?: () => void;

  innerProps?: InnerProps;

  rtl: boolean;

  extra?: (() => VueNode) | VueNode;
}

/**
 * Fill component to provided the scroll content real height.
 */
const Filler = defineComponent(
  ({ height, offsetY, offsetX, prefixCls, onInnerResize, innerProps, rtl, extra }: FillerProps) => {
    const slots = defineSlots({
      default: () => <></>,
    });
    const domRef = useRef();
    const outerStyle = computed(() => {
      let result: CSSProperties = {};
      if (offsetY !== undefined) {
        // Not set `width` since this will break `sticky: right`
        result = {
          height: `${height}px`,
          position: 'relative',
          overflow: 'hidden',
        };
      }
      return result;
    });

    const innerStyle = computed(() => {
      let result: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
      };
      if (offsetY !== undefined) {
        result = {
          ...result,
          transform: `translateY(${offsetY}px)`,
          [rtl ? 'marginRight' : 'marginLeft']: `${-offsetX || 0}px`,
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
        };
      }
      return result;
    });

    defineExpose({
      get nativeElement() {
        return domRef.value;
      },
    });

    return () => (
      <div style={outerStyle.value}>
        <ResizeObserver
          onResize={({ offsetHeight }) => {
            if (offsetHeight && onInnerResize) {
              onInnerResize();
            }
          }}
        >
          <div style={innerStyle.value} class={clsx({ [`${prefixCls}-holder-inner`]: prefixCls })} ref={domRef} {...innerProps}>
            <slots.default></slots.default>
            {resolveVNode(extra)}
          </div>
        </ResizeObserver>
      </div>
    );
  },
  { inheritAttrs: false, name: 'Filler' },
);

export default Filler;
