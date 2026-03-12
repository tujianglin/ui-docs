import type { RenderNode } from '../../util/src/types';

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
