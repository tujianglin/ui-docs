import type { Key, VueNode } from '@vc-com/util/lib/types';
import type { CSSProperties, Ref } from 'vue';
import type { MouseEventHandler } from 'vue-jsx-vapor';

export type { Key };

export type { ScrollTo } from '@vc-com/virtual-list';

export interface TreeNodeProps<TreeDataType extends BasicDataNode = DataNode> {
  eventKey?: Key; // Pass by parent `cloneElement`
  prefixCls?: string;
  class?: string;
  style?: CSSProperties;
  id?: string;
  treeId?: string;

  // By parent
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean;
  loaded?: boolean;
  loading?: boolean;
  halfChecked?: boolean;
  title?: VueNode | ((data: TreeDataType) => VueNode);
  dragOver?: boolean;
  dragOverGapTop?: boolean;
  dragOverGapBottom?: boolean;
  pos?: string;
  domRef?: Ref<HTMLDivElement>;
  /** New added in Tree for easy data access */
  data?: TreeDataType;
  isStart?: boolean[];
  isEnd?: boolean[];
  active?: boolean;
  onMouseMove?: MouseEventHandler<HTMLDivElement>;

  // By user
  isLeaf?: boolean;
  checkable?: boolean;
  selectable?: boolean;
  disabled?: boolean;
  disableCheckbox?: boolean;
  icon?: IconType;
  switcherIcon?: IconType;
  children?: VueNode;
}

/** For fieldNames, we provides a abstract interface */
export interface BasicDataNode {
  checkable?: boolean;
  disabled?: boolean;
  disableCheckbox?: boolean;
  icon?: IconType;
  isLeaf?: boolean;
  selectable?: boolean;
  switcherIcon?: IconType;

  /** Set style of TreeNode. This is not recommend if you don't have any force requirement */
  class?: string;
  style?: CSSProperties;
}

/** Provide a wrap type define for developer to wrap with customize fieldNames data type */
export type FieldDataNode<T, ChildFieldName extends string = 'children'> = BasicDataNode &
  T &
  Partial<Record<ChildFieldName, FieldDataNode<T, ChildFieldName>[]>>;

/**
 * Typescript not support `bigint` as index type yet.
 * We use this to mark the `bigint` type is for `Key` usage.
 * It's safe to remove this when typescript fix:
 * https://github.com/microsoft/TypeScript/issues/50217
 */
export type SafeKey = Exclude<Key, bigint>;

export type KeyEntities<DateType extends BasicDataNode = any> = Record<SafeKey, DataEntity<DateType>>;

export type DataNode = FieldDataNode<{
  key: Key;
  title?: VueNode | ((data: DataNode) => VueNode);
}>;

export type EventDataNode<TreeDataType = any> = {
  key: Key;
  expanded: boolean;
  selected: boolean;
  checked: boolean;
  loaded: boolean;
  loading: boolean;
  halfChecked: boolean;
  dragOver: boolean;
  dragOverGapTop: boolean;
  dragOverGapBottom: boolean;
  pos: string;
  active: boolean;
} & TreeDataType &
  BasicDataNode;

export type IconType = VueNode | ((props: TreeNodeProps) => VueNode);

export type NodeElement = TreeNodeProps & {
  selectHandle?: HTMLSpanElement;
  type?: {
    isTreeNode: boolean;
  };
};

export type NodeInstance<TreeDataType extends BasicDataNode = DataNode> = TreeNodeProps<TreeDataType> & {
  selectHandle?: HTMLSpanElement;
};

export interface Entity {
  node: NodeElement;
  index: number;
  key: Key;
  pos: string;
  parent?: Entity;
  children?: Entity[];
}

export interface DataEntity<TreeDataType extends BasicDataNode = DataNode> extends Omit<Entity, 'node' | 'parent' | 'children'> {
  node: TreeDataType;
  nodes: TreeDataType[];
  parent?: DataEntity<TreeDataType>;
  children?: DataEntity<TreeDataType>[];
  level: number;
}

export interface FlattenNode<TreeDataType extends BasicDataNode = DataNode> {
  parent: FlattenNode<TreeDataType> | null;
  children: FlattenNode<TreeDataType>[];
  pos: string;
  data: TreeDataType;
  title: VueNode;
  key: Key;
  isStart: boolean[];
  isEnd: boolean[];
}

export type GetKey<RecordType> = (record: RecordType, index?: number) => Key;

export type GetCheckDisabled<RecordType> = (record: RecordType) => boolean;

export type Direction = 'ltr' | 'rtl' | undefined;

export interface FieldNames {
  title?: string;
  /** @private Internal usage for `rc-tree-select`, safe to remove if no need */
  _title?: string[];
  key?: string;
  children?: string;
}
