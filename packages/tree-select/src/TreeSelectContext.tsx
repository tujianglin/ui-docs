import type { ExpandAction } from '@vc-com/tree/Tree';
import { reactiveComputed } from '@vueuse/core';
import { defineComponent, inject, provide, reactive, type InjectionKey, type Reactive } from 'vue';
import type { UIEventHandler } from 'vue-jsx-vapor';
import type { VueNode } from '../../util/src/types';
import type useDataEntities from './hooks/useDataEntities';
import type { DataNode, FieldNames, Key } from './interface';
import type { TreeSelectProps } from './TreeSelect';

export interface TreeSelectContextProps {
  virtual?: boolean;
  popupMatchSelectWidth?: boolean | number;
  listHeight: number;
  listItemHeight: number;
  listItemScrollOffset?: number;
  treeData: DataNode[];
  fieldNames: FieldNames;
  onSelect: (value: Key, info: { selected: boolean }) => void;
  treeExpandAction?: ExpandAction;
  treeTitleRender?: (node: any) => VueNode;
  onPopupScroll?: UIEventHandler<HTMLDivElement>;

  // For `maxCount` usage
  leftMaxCount: number | null;
  /** When `true`, only take leaf node as count, or take all as count with `maxCount` limitation */
  leafCountOnly: boolean;
  valueEntities: ReturnType<typeof useDataEntities>['valueEntities'];
  classNames: TreeSelectProps['classNames'];
  styles: TreeSelectProps['styles'];
}

const TreeSelectContext: InjectionKey<Reactive<TreeSelectContextProps>> = Symbol('TreeSelectContext');

export const useTreeSelectContextInject = (): Partial<TreeSelectContextProps> => {
  return inject(TreeSelectContext, reactive({} as TreeSelectContextProps));
};

export const TreeSelectContextProvider = defineComponent(({ value }: { value: TreeSelectContextProps }) => {
  provide(
    TreeSelectContext,
    reactiveComputed(() => value),
  );
  return () => <slot></slot>;
});
