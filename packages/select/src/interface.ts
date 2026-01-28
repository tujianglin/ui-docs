import type { Key, RenderNode } from '../../util/src/types';

export type RawValueType = string | number;
export interface FlattenOptionData<OptionType> {
  label?: RenderNode;
  data: OptionType;
  key: Key;
  value?: RawValueType;
  groupOption?: boolean;
  group?: boolean;
}

export interface DisplayValueType {
  key?: Key;
  value?: RawValueType;
  label?: RenderNode;
  title?: RenderNode;
  disabled?: boolean;
  index?: number;
}

export type RenderDOMFunc = (props: any) => HTMLElement;

export type Mode = 'multiple' | 'tags' | 'combobox';

export type Placement = 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';

export type DisplayInfoType = 'add' | 'remove' | 'clear';
