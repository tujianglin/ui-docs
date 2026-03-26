import CSSMotion from '@vc-com/motion';
import { composeRef } from '@vc-com/util/lib/ref';
import { clsx } from 'clsx';
import { computed, defineComponent, nextTick, ref, watch, type CSSProperties, type Ref } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import type { SegmentedValue } from '.';

type ThumbReact = {
  left: number;
  right: number;
  width: number;
  top: number;
  bottom: number;
  height: number;
} | null;

export interface MotionThumbInterface {
  containerRef: Ref<HTMLDivElement>;
  value: SegmentedValue;
  getValueIndex: (value: SegmentedValue) => number;
  prefixCls: string;
  motionName: string;
  onMotionStart: VoidFunction;
  onMotionEnd: VoidFunction;
  direction?: 'ltr' | 'rtl';
  vertical?: boolean;
}

const calcThumbStyle = (targetElement: HTMLElement | null | undefined, vertical?: boolean): ThumbReact => {
  if (!targetElement) return null;

  const style: ThumbReact = {
    left: targetElement.offsetLeft,
    right: (targetElement.parentElement!.clientWidth as number) - targetElement.clientWidth - targetElement.offsetLeft,
    width: targetElement.clientWidth,
    top: targetElement.offsetTop,
    bottom: (targetElement.parentElement!.clientHeight as number) - targetElement.clientHeight - targetElement.offsetTop,
    height: targetElement.clientHeight,
  };

  if (vertical) {
    // Adjusts positioning and size for vertical layout by setting horizontal properties to 0 and using vertical properties from the style object.
    return {
      left: 0,
      right: 0,
      width: 0,
      top: style.top,
      bottom: style.bottom,
      height: style.height,
    };
  }

  return {
    left: style.left,
    right: style.right,
    width: style.width,
    top: 0,
    bottom: 0,
    height: 0,
  };
};

const toPX = (value: number | undefined): string | undefined => (value !== undefined ? `${value}px` : undefined);

const MotionThumb = defineComponent(
  ({
    prefixCls,
    containerRef,
    value,
    getValueIndex,
    motionName,
    onMotionStart,
    onMotionEnd,
    direction,
    vertical = false,
  }: MotionThumbInterface) => {
    const thumbRef = useRef<HTMLDivElement>(null);
    const prevValue = ref(value);

    // =========================== Effect ===========================
    const findValueElement = (val: SegmentedValue) => {
      const index = getValueIndex(val);
      const ele = containerRef.value?.querySelectorAll<HTMLDivElement>(`.${prefixCls}-item`)[index];
      return ele?.offsetParent && ele;
    };

    const prevStyle = ref<ThumbReact>(null);
    const nextStyle = ref<ThumbReact>(null);

    watch(
      () => value,
      async () => {
        await nextTick();
        if (prevValue.value !== value) {
          const prev = findValueElement(prevValue.value);
          const next = findValueElement(value);

          const calcPrevStyle = calcThumbStyle(prev, vertical);
          const calcNextStyle = calcThumbStyle(next, vertical);

          prevValue.value = value;
          prevStyle.value = calcPrevStyle;
          nextStyle.value = calcNextStyle;

          if (prev && next) {
            onMotionStart();
          } else {
            onMotionEnd();
          }
        }
      },
      { immediate: true, flush: 'post' },
    );

    const thumbStart = computed(() => {
      if (vertical) {
        return toPX(prevStyle.value?.top ?? 0);
      }

      if (direction === 'rtl') {
        return toPX(-(prevStyle.value?.right as number));
      }

      return toPX(prevStyle.value?.left as number);
    });

    const thumbActive = computed(() => {
      if (vertical) {
        return toPX(nextStyle.value?.top ?? 0);
      }

      if (direction === 'rtl') {
        return toPX(-(nextStyle.value?.right as number));
      }

      return toPX(nextStyle.value?.left as number);
    });

    // =========================== Motion ===========================
    const onAppearStart = () => {
      if (vertical) {
        return {
          transform: 'translateY(var(--thumb-start-top))',
          height: 'var(--thumb-start-height)',
        };
      }

      return {
        transform: 'translateX(var(--thumb-start-left))',
        width: 'var(--thumb-start-width)',
      };
    };

    const onAppearActive = () => {
      if (vertical) {
        return {
          transform: 'translateY(var(--thumb-active-top))',
          height: 'var(--thumb-active-height)',
        };
      }

      return {
        transform: 'translateX(var(--thumb-active-left))',
        width: 'var(--thumb-active-width)',
      };
    };

    const onVisibleChanged = () => {
      prevStyle.value = null;
      nextStyle.value = null;
      onMotionEnd();
    };

    // =========================== Render ===========================
    return () => {
      // No need motion when nothing exist in queue
      if (!prevStyle.value || !nextStyle.value) {
        return null;
      }

      return (
        <CSSMotion
          visible
          motionName={motionName}
          motionAppear
          onAppearStart={onAppearStart}
          onAppearActive={onAppearActive}
          onVisibleChanged={onVisibleChanged}
        >
          {({ class: motionClassName, style: motionStyle, ref: motionRef }) => {
            const mergedStyle = {
              ...motionStyle,
              '--thumb-start-left': thumbStart.value,
              '--thumb-start-width': toPX(prevStyle.value?.width),
              '--thumb-active-left': thumbActive.value,
              '--thumb-active-width': toPX(nextStyle.value?.width),
              '--thumb-start-top': thumbStart.value,
              '--thumb-start-height': toPX(prevStyle.value?.height),
              '--thumb-active-top': thumbActive.value,
              '--thumb-active-height': toPX(nextStyle.value?.height),
            } as CSSProperties;

            // It's little ugly which should be refactor when @umi/test update to latest jsdom
            const motionProps = {
              ref: composeRef(thumbRef, motionRef),
              style: mergedStyle,
              class: clsx(`${prefixCls}-thumb`, motionClassName),
            };

            if (process.env.NODE_ENV === 'test') {
              (motionProps as any)['data-test-style'] = JSON.stringify(mergedStyle);
            }

            return <div {...motionProps} />;
          }}
        </CSSMotion>
      );
    };
  },
  { inheritAttrs: false },
);

export default MotionThumb;
