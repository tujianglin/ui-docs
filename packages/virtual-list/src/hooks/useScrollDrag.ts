import raf from '@vc-com/util/lib/raf';
import { watch, type Ref } from 'vue';

function smoothScrollOffset(offset: number) {
  return Math.floor(offset ** 0.5);
}

export function getPageXY(e: MouseEvent | TouchEvent | MouseEvent | TouchEvent, horizontal: boolean) {
  const obj = 'touches' in e ? e.touches[0] : e;
  return obj[horizontal ? 'pageX' : 'pageY'] - window[horizontal ? 'scrollX' : 'scrollY'];
}

export default function useScrollDrag(
  inVirtual: Ref<boolean>,
  componentRef: Ref<HTMLElement>,
  onScrollOffset: (offset: number) => void,
) {
  watch(inVirtual, () => {
    const ele = componentRef.value;
    if (inVirtual.value && ele) {
      let mouseDownLock = false;
      let rafId: number;
      let offset: number;

      const stopScroll = () => {
        raf.cancel(rafId);
      };

      const continueScroll = () => {
        stopScroll();

        rafId = raf(() => {
          onScrollOffset(offset);
          continueScroll();
        });
      };

      const clearDragState = () => {
        mouseDownLock = false;
        stopScroll();
      };

      const onMousedown = (e: MouseEvent) => {
        // Skip if element set draggable
        if ((e.target as HTMLElement).draggable || e.button !== 0) {
          return;
        }
        // Skip if nest List has handled this event
        const event = e as MouseEvent & {
          _virtualHandled?: boolean;
        };
        if (!event._virtualHandled) {
          event._virtualHandled = true;
          mouseDownLock = true;
        }
      };

      const onMouseMove = (e: MouseEvent) => {
        if (mouseDownLock) {
          const mouseY = getPageXY(e, false);
          const { top, bottom } = ele.getBoundingClientRect();

          if (mouseY <= top) {
            const diff = top - mouseY;
            offset = -smoothScrollOffset(diff);
            continueScroll();
          } else if (mouseY >= bottom) {
            const diff = mouseY - bottom;
            offset = smoothScrollOffset(diff);
            continueScroll();
          } else {
            stopScroll();
          }
        }
      };

      ele.addEventListener('mousedown', onMousedown);
      ele.ownerDocument.addEventListener('mouseup', clearDragState);
      ele.ownerDocument.addEventListener('mousemove', onMouseMove);

      ele.ownerDocument.addEventListener('dragend', clearDragState);

      return () => {
        ele.removeEventListener('mousedown', onMousedown);
        ele.ownerDocument.removeEventListener('mouseup', clearDragState);
        ele.ownerDocument.removeEventListener('mousemove', onMouseMove);

        ele.ownerDocument.removeEventListener('dragend', clearDragState);
        stopScroll();
      };
    }
  });
}
