import type { DataEntity, IconType } from '@vc-com/tree/interface';
import { reactiveComputed } from '@vueuse/core';
import { defineComponent, inject, provide, reactive, type InjectionKey, type Reactive } from 'vue';
import type { VueNode } from '../../util/src/types';
import type { Key, LegacyDataNode, SafeKey } from './interface';

interface LegacyContextProps {
  checkable: boolean | VueNode;
  checkedKeys: Key[];
  halfCheckedKeys: Key[];
  treeExpandedKeys: Key[];
  treeDefaultExpandedKeys: Key[];
  onTreeExpand: (keys: Key[]) => void;
  treeDefaultExpandAll: boolean;
  treeIcon: IconType;
  showTreeIcon: boolean;
  switcherIcon: IconType;
  treeLine: boolean;
  treeNodeFilterProp: string;
  treeLoadedKeys: Key[];
  treeMotion: any;
  loadData: (treeNode: LegacyDataNode) => Promise<unknown>;
  onTreeLoad: (loadedKeys: Key[]) => void;

  keyEntities: Record<SafeKey, DataEntity<any>>;
}

const LegacySelectContext: InjectionKey<Reactive<LegacyContextProps>> = Symbol('LegacySelectContext');

export const useLegacySelectContextInject = () => {
  return inject(LegacySelectContext, reactive({} as LegacyContextProps));
};

export const LegacySelectContextProvider = defineComponent(({ value }: { value: LegacyContextProps }) => {
  provide(
    LegacySelectContext,
    reactiveComputed(() => value),
  );
  return () => <slot></slot>;
});
