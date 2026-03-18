import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, ref, watch, type CSSProperties, type Reactive, type Ref } from 'vue';
import type { Placement } from '../Drawer';

export interface UseDragOptions {
  prefixCls: string;
  direction: Placement;
  class?: string;
  style?: CSSProperties;
  maxSize?: number;
  containerRef?: HTMLElement;
  currentSize?: number | string;
  onResize?: (size: number) => void;
  onResizeEnd?: (size: number) => void;
  onResizeStart?: (size: number) => void;
}

export interface UseDragReturn {
  dragElementProps: {
    class: string;
    style: CSSProperties;
    onMousedown: (e) => void;
  };
  isDragging: Ref<boolean>;
}

export default function useDrag(options: Reactive<UseDragOptions>): UseDragReturn {
  const {
    prefixCls,
    direction,
    class: className,
    style,
    maxSize,
    containerRef,
    currentSize,
    onResize,
    onResizeEnd,
    onResizeStart,
  } = $(options);

  const isDragging = ref<boolean>(false);
  const startPos = ref<number>(0);
  const startSize = ref<number>(0);

  const isHorizontal = computed(() => direction === 'left' || direction === 'right');

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    isDragging.value = true;

    if (isHorizontal.value) {
      startPos.value = e.clientX;
    } else {
      startPos.value = e.clientY;
    }

    // Use provided currentSize, or fallback to container size
    let sSize: number;
    if (typeof currentSize === 'number') {
      sSize = currentSize;
    } else if (containerRef) {
      const rect = containerRef.getBoundingClientRect();
      sSize = isHorizontal ? rect.width : rect.height;
    }

    startSize.value = sSize;
    onResizeStart?.(sSize);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return;

    const currentPos = isHorizontal.value ? e.clientX : e.clientY;
    let delta = currentPos - startPos.value;

    // Adjust delta direction based on placement
    if (direction === 'right' || direction === 'bottom') {
      delta = -delta;
    }

    let newSize = startSize.value + delta;

    // Apply min/max size limits
    if (newSize < 0) {
      newSize = 0;
    }
    // Only apply maxSize if it's a valid positive number
    if (maxSize && newSize > maxSize) {
      newSize = maxSize;
    }

    onResize?.(newSize);
  };

  const handleMouseUp = () => {
    if (isDragging.value) {
      isDragging.value = false;

      // Get the final size after resize
      if (containerRef) {
        const rect = containerRef.getBoundingClientRect();
        const finalSize = isHorizontal ? rect.width : rect.height;
        onResizeEnd?.(finalSize);
      }
    }
  };

  watch(isDragging, (_n, _o, onCleanp) => {
    if (isDragging.value) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      onCleanp(() => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      });
    }
  });

  const dragElementClassName = computed(() =>
    clsx(
      `${prefixCls}-dragger`,
      `${prefixCls}-dragger-${direction}`,
      {
        [`${prefixCls}-dragger-dragging`]: isDragging.value,
        [`${prefixCls}-dragger-horizontal`]: isHorizontal.value,
        [`${prefixCls}-dragger-vertical`]: !isHorizontal.value,
      },
      className,
    ),
  );

  return {
    dragElementProps: reactiveComputed(() => ({
      class: dragElementClassName.value,
      style,
      onMousedown: handleMouseDown,
    })),
    isDragging,
  };
}
