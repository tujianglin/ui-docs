import { warning } from '@vc-com/util/lib/warning';
import { Collection } from './Collection';
import SingleObserver from './SingleObserver';

const INTERNAL_PREFIX_KEY = 'rc-observer-key';

import { filterEmpty } from '@vc-com/util/lib/props-util';
import { defineComponent, type VNode } from 'vue';
import { _rs } from './utils/observerUtil';
export {
  /** @private Test only for mock trigger resize event */
  _rs,
};

export interface SizeInfo {
  width: number;
  height: number;
  offsetWidth: number;
  offsetHeight: number;
}

export type OnResize = (size: SizeInfo, element: HTMLElement) => void;

export interface ResizeObserverProps {
  /** Pass to ResizeObserver.Collection with additional data */
  data?: any;
  disabled?: boolean;
  /** Trigger if element resized. Will always trigger when first time render. */
  onResize?: OnResize;
}

const RefResizeObserver = defineComponent((props: ResizeObserverProps, { slots }) => {
  return () => {
    const childNodes = filterEmpty(slots.default?.() ?? []).filter(Boolean) as VNode[];

    if (process.env.NODE_ENV !== 'production') {
      if (childNodes.length > 1) {
        warning(
          false,
          'Find more than one child node with `children` in ResizeObserver. Please use ResizeObserver.Collection instead.',
        );
      } else if (childNodes.length === 0) {
        warning(false, '`children` of ResizeObserver is empty. Nothing is in observe.');
      }
    }
    return (
      <SingleObserver v-for={(child, index) in childNodes} {...props} key={child?.key || `${INTERNAL_PREFIX_KEY}-${index}`}>
        {child}
      </SingleObserver>
    );
  };
});

type CompoundedComponent = typeof RefResizeObserver & {
  Collection: typeof Collection;
};

const ResizeObserver = RefResizeObserver as CompoundedComponent;

if (process.env.NODE_ENV !== 'production') {
  RefResizeObserver.displayName = 'ResizeObserver';
}

ResizeObserver.Collection = Collection;

export default ResizeObserver;
