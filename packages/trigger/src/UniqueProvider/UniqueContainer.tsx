import type { CSSMotionProps } from '@vc-com/motion';
import CSSMotion from '@vc-com/motion';
import { clsx } from 'clsx';
import { computed, defineComponent, shallowRef, watchEffect, type CSSProperties } from 'vue';
import useOffsetStyle from '../hooks/useOffsetStyle';
import type { AlignType, ArrowPos } from '../interface';

export interface UniqueContainerProps {
  prefixCls: string; // ${prefixCls}-unique-container
  isMobile: boolean;
  ready: boolean;
  open: boolean;
  align: AlignType;
  offsetR: number;
  offsetB: number;
  offsetX: number;
  offsetY: number;
  arrowPos?: ArrowPos;
  popupSize?: { width: number; height: number };
  motion?: CSSMotionProps;
  uniqueContainerClassName?: string;
  uniqueContainerStyle?: CSSProperties;
}

const UniqueContainer = defineComponent((props: UniqueContainerProps) => {
  const {
    prefixCls,
    isMobile,
    ready,
    open,
    align,
    offsetR,
    offsetB,
    offsetX,
    offsetY,
    arrowPos,
    popupSize,
    motion,
    uniqueContainerClassName,
    uniqueContainerStyle,
  } = $(props);

  const containerCls = computed(() => `${prefixCls}-unique-container`);

  const motionVisible = shallowRef(false);

  // ========================= Styles =========================
  const offsetStyle = useOffsetStyle(
    computed(() => isMobile),
    computed(() => ready),
    computed(() => open),
    computed(() => align),
    computed(() => offsetR),
    computed(() => offsetB),
    computed(() => offsetX),
    computed(() => offsetY),
  );

  // Cache for offsetStyle when ready is true
  const cachedOffsetStyleRef = shallowRef(offsetStyle.value);

  watchEffect(() => {
    // Update cached offset style when ready is true
    if (ready) {
      cachedOffsetStyleRef.value = offsetStyle.value;
    }
  });
  // ========================= Render =========================
  return () => {
    // Apply popup size if available
    const sizeStyle: CSSProperties = {};
    if (popupSize) {
      sizeStyle.width = popupSize.width;
      sizeStyle.height = popupSize.height;
    }
    return (
      <CSSMotion
        motionAppear
        motionEnter
        motionLeave
        removeOnLeave={false}
        leavedClassName={`${containerCls.value}-hidden`}
        {...motion}
        visible={open}
        onVisibleChanged={(nextVisible) => {
          motionVisible.value = nextVisible;
        }}
      >
        {({ class: motionClassName, style: motionStyle }) => {
          const cls = clsx(containerCls.value, motionClassName, uniqueContainerClassName, {
            [`${containerCls.value}-visible`]: motionVisible.value,
          });

          return (
            <div
              class={cls}
              style={
                {
                  '--arrow-x': `${arrowPos?.x || 0}px`,
                  '--arrow-y': `${arrowPos?.y || 0}px`,
                  ...cachedOffsetStyleRef.value,
                  ...sizeStyle,
                  ...motionStyle,
                  ...uniqueContainerStyle,
                } as CSSProperties
              }
            />
          );
        }}
      </CSSMotion>
    );
  };
});

export default UniqueContainer;
