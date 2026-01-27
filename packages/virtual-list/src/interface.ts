import type { VueNode } from '@vc-com/util/lib/types';
import type { CSSProperties } from 'vue';

export type RenderFunc<T> = (item: T, index: number, props: { style: CSSProperties; offsetX: number }) => VueNode;

export interface SharedConfig<T> {
  getKey: (item: T) => PropertyKey;
}

export type GetKey<T> = (item: T) => PropertyKey;

export type GetSize = (startKey: PropertyKey, endKey?: PropertyKey) => { top: number; bottom: number };

export interface ExtraRenderInfo {
  /** Virtual list start line */
  start: number;
  /** Virtual list end line */
  end: number;
  /** Is current in virtual render */
  virtual: boolean;
  /** Used for `scrollWidth` tell the horizontal offset */
  offsetX: number;
  offsetY: number;

  rtl: boolean;

  getSize: GetSize;
}
