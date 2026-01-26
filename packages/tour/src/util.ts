import { computed, type Ref } from 'vue';
import type { PlacementType } from './placements';

export function isInViewPort(element: HTMLElement) {
  const viewWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewHeight = window.innerHeight || document.documentElement.clientHeight;
  const { top, right, bottom, left } = element.getBoundingClientRect();

  return top >= 0 && left >= 0 && right <= viewWidth && bottom <= viewHeight;
}

export function getPlacement(
  targetElement?: Ref<HTMLElement | null>,
  placement?: Ref<PlacementType>,
  stepPlacement?: Ref<PlacementType>,
) {
  return computed(() => stepPlacement?.value ?? placement.value ?? (targetElement.value === null ? 'center' : 'bottom'));
}
