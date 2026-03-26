import type { RenderNode } from '@vc-com/util/lib/types';

export interface Option {
  code?: string;
  name?: string;
  nodes?: Option[];
  disabled?: boolean;
}

export interface Option2 {
  value?: string;
  label?: RenderNode;
  title?: RenderNode;
  disabled?: boolean;
  disableCheckbox?: boolean;
  isLeaf?: boolean;
  loading?: boolean;
  children?: Option2[];
}
