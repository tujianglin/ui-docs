import type { Key, SafeKey, DataNode as TreeDataNode } from '@vc-com/tree/interface';
import type { VueNode } from '../../util/src/types';

export type { Key, SafeKey };

export interface DataNode extends Record<string, any>, Omit<TreeDataNode, 'key' | 'children'> {
  key?: Key;
  value?: SafeKey;
  children?: DataNode[];
}

export type SelectSource = 'option' | 'selection' | 'input' | 'clear';

export interface LabeledValueType {
  key?: Key;
  value?: SafeKey;
  label?: VueNode;
  /** Only works on `treeCheckStrictly` */
  halfChecked?: boolean;
}

export type DefaultValueType = SafeKey | LabeledValueType | (SafeKey | LabeledValueType)[];

export interface LegacyDataNode extends DataNode {
  props: any;
}

export interface FlattenDataNode {
  data: DataNode;
  key: Key;
  value: SafeKey;
  level: number;
  parent?: FlattenDataNode;
}

export interface SimpleModeConfig {
  id?: SafeKey;
  pId?: SafeKey;
  rootPId?: SafeKey;
}

export interface ChangeEventExtra {
  triggerValue: SafeKey;
}

export interface FieldNames {
  value?: string;
  label?: string;
  children?: string;
  _title?: string[];
}
