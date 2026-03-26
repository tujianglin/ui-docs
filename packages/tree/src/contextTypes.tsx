/**
 * Webpack has bug for import loop, which is not the same behavior as ES module.
 * When util.js imports the TreeNode for tree generate will cause treeContextTypes be empty.
 */
import type { RenderNode, VueNode } from '@vc-com/util/lib/types';
import { reactiveComputed } from '@vueuse/core';
import { defineComponent, inject, provide, reactive, type CSSProperties, type InjectionKey, type Reactive } from 'vue';
import type { BasicDataNode, DataNode, Direction, EventDataNode, IconType, Key, KeyEntities, TreeNodeProps } from './interface';
import type { DraggableConfig, SemanticName } from './Tree';

export type NodeMouseEventParams<TreeDataType extends BasicDataNode = DataNode> = {
  event: MouseEvent;
  node: EventDataNode<TreeDataType>;
};
export type NodeDragEventParams<TreeDataType extends BasicDataNode = DataNode> = {
  event: DragEvent;
  node: EventDataNode<TreeDataType>;
};

export type NodeMouseEventHandler<TreeDataType extends BasicDataNode = DataNode> = (
  e: MouseEvent,
  node: EventDataNode<TreeDataType>,
) => void;
export type NodeDragEventHandler<TreeDataType extends BasicDataNode = DataNode> = (
  e: DragEvent,
  nodeProps: TreeNodeProps<TreeDataType>,
  outsideTree?: boolean,
) => void;

export interface TreeContextProps<TreeDataType extends BasicDataNode = DataNode> {
  styles?: Partial<Record<SemanticName, CSSProperties>>;
  classNames?: Partial<Record<SemanticName, string>>;
  prefixCls: string;
  selectable: boolean;
  showIcon: boolean;
  icon: IconType;
  switcherIcon: IconType;
  draggable?: DraggableConfig;
  draggingNodeKey?: Key;
  checkable: boolean | RenderNode;
  checkStrictly: boolean;
  disabled: boolean;
  keyEntities: KeyEntities;
  // for details see comment in Tree.state (Tree.tsx)
  dropLevelOffset?: number;
  dropContainerKey: Key | null;
  dropTargetKey: Key | null;
  dropPosition: -1 | 0 | 1 | null;
  indent: number | null;
  dropIndicatorRender: (props: {
    dropPosition: -1 | 0 | 1;
    dropLevelOffset: number;
    indent: number;
    prefixCls: string;
    direction: Direction;
  }) => VueNode;
  dragOverNodeKey: Key | null;
  direction: Direction;

  loadData: (treeNode: EventDataNode<TreeDataType>) => Promise<void>;
  filterTreeNode: (treeNode: EventDataNode<TreeDataType>) => boolean;
  titleRender?: (node: any) => VueNode;

  onNodeClick: NodeMouseEventHandler<TreeDataType>;
  onNodeDoubleClick: NodeMouseEventHandler<TreeDataType>;
  onNodeExpand: NodeMouseEventHandler<TreeDataType>;
  onNodeSelect: NodeMouseEventHandler<TreeDataType>;
  onNodeCheck: (e: MouseEvent, treeNode: EventDataNode<TreeDataType>, checked: boolean) => void;
  onNodeLoad: (treeNode: EventDataNode<TreeDataType>) => void;
  onNodeMouseEnter: NodeMouseEventHandler<TreeDataType>;
  onNodeMouseLeave: NodeMouseEventHandler<TreeDataType>;
  onNodeContextMenu: NodeMouseEventHandler<TreeDataType>;
  onNodeDragStart: NodeDragEventHandler;
  onNodeDragEnter: NodeDragEventHandler;
  onNodeDragOver: NodeDragEventHandler;
  onNodeDragLeave: NodeDragEventHandler;
  onNodeDragEnd: NodeDragEventHandler;
  onNodeDrop: NodeDragEventHandler;
}

const TreeContext: InjectionKey<Reactive<TreeContextProps>> = Symbol('TreeContext');

export const useTreeContextInject = () => {
  return inject(TreeContext, reactive({} as TreeContextProps));
};

export const TreeContextProvider = defineComponent(({ value }: { value?: TreeContextProps }) => {
  provide(
    TreeContext,
    reactiveComputed(() => value),
  );
  return () => <slot></slot>;
});

const UnstableContext: InjectionKey<{ nodeDisabled?: (n: DataNode) => boolean }> = Symbol('UnstableContext');

export const useUnstableContextInject = () => {
  return inject(UnstableContext, {});
};

export const UnstableContextProvider = defineComponent(({ value }: { value?: { nodeDisabled?: (n: DataNode) => boolean } }) => {
  provide(UnstableContext, value);
  return () => <slot></slot>;
});
