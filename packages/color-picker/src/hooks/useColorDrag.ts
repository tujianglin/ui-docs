import { onBeforeUnmount, ref, shallowRef, watch, type Reactive, type Ref } from 'vue';
import type { Color } from '../color';
import type { TransformOffset } from '../interface';

type EventType = MouseEvent | TouchEvent;

type EventHandle = (e: EventType) => void;

interface useColorDragProps {
  color: Color;
  containerRef: Ref<HTMLDivElement>;
  targetRef: Ref<HTMLDivElement>;
  direction?: 'x' | 'y';
  onDragChange?: (offset: TransformOffset) => void;
  onDragChangeComplete?: () => void;
  calculate?: () => TransformOffset;
  /** Disabled drag */
  disabledDrag?: boolean;
}

function getPosition(e: EventType) {
  const obj = 'touches' in e ? e.touches[0] : e;
  const scrollXOffset = document.documentElement.scrollLeft || document.body.scrollLeft || window.pageXOffset;
  const scrollYOffset = document.documentElement.scrollTop || document.body.scrollTop || window.pageYOffset;
  return { pageX: obj.pageX - scrollXOffset, pageY: obj.pageY - scrollYOffset };
}

function useColorDrag(props: Reactive<useColorDragProps>): [Ref<TransformOffset>, EventHandle] {
  const { targetRef, containerRef, direction, onDragChange, onDragChangeComplete, calculate, color, disabledDrag } = $(props);
  const offsetValue = ref({ x: 0, y: 0 });
  const mouseMoveRef = shallowRef<(event: MouseEvent) => void>(null);
  const mouseUpRef = shallowRef<(event: MouseEvent) => void>(null);

  // Always get position from `color`
  watch(
    () => color,
    () => {
      offsetValue.value = calculate?.();
    },
    { immediate: true, deep: true },
  );

  onBeforeUnmount(() => {
    document.removeEventListener('mousemove', mouseMoveRef.value);
    document.removeEventListener('mouseup', mouseUpRef.value);
    document.removeEventListener('touchmove', mouseMoveRef.value as any);
    document.removeEventListener('touchend', mouseUpRef.value as any);
    mouseMoveRef.value = null;
    mouseUpRef.value = null;
  });

  const updateOffset: EventHandle = (e) => {
    const { pageX, pageY } = getPosition(e);
    const { x: rectX, y: rectY, width, height } = containerRef.getBoundingClientRect();
    const { width: targetWidth, height: targetHeight } = targetRef.getBoundingClientRect();
    const centerOffsetX = targetWidth / 2;
    const centerOffsetY = targetHeight / 2;

    const offsetX = Math.max(0, Math.min(pageX - rectX, width)) - centerOffsetX;
    const offsetY = Math.max(0, Math.min(pageY - rectY, height)) - centerOffsetY;

    const calcOffset = {
      x: offsetX,
      y: direction === 'x' ? offsetValue.value.y : offsetY,
    };

    // Exclusion of boundary cases
    if ((targetWidth === 0 && targetHeight === 0) || targetWidth !== targetHeight) {
      return false;
    }

    onDragChange?.(calcOffset);
  };

  const onDragMove: EventHandle = (e) => {
    e.preventDefault();
    updateOffset(e);
  };

  const onDragStop: EventHandle = (e) => {
    e.preventDefault();
    document.removeEventListener('mousemove', mouseMoveRef.value);
    document.removeEventListener('mouseup', mouseUpRef.value);
    document.removeEventListener('touchmove', mouseMoveRef.value as any);
    document.removeEventListener('touchend', mouseUpRef.value as any);
    mouseMoveRef.value = null;
    mouseUpRef.value = null;
    onDragChangeComplete?.();
  };

  const onDragStart: EventHandle = (e) => {
    // https://github.com/ant-design/ant-design/issues/43529
    document.removeEventListener('mousemove', mouseMoveRef.value);
    document.removeEventListener('mouseup', mouseUpRef.value);

    if (disabledDrag) {
      return;
    }
    updateOffset(e);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragStop);
    document.addEventListener('touchmove', onDragMove);
    document.addEventListener('touchend', onDragStop);
    mouseMoveRef.value = onDragMove;
    mouseUpRef.value = onDragStop;
  };

  return [offsetValue, onDragStart];
}

export default useColorDrag;
