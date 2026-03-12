import type { RenderNode } from '@vc-com/util/lib/types';
import { reactiveComputed } from '@vueuse/core';
import { defineComponent, inject, provide, reactive, type CSSProperties, type InjectionKey, type Reactive } from 'vue';
import type { CascaderProps, DefaultOptionType, InternalFieldNames, SingleValueType } from './Cascader';

export interface CascaderContextProps {
  options: NonNullable<CascaderProps['options']>;
  fieldNames: InternalFieldNames;
  values: SingleValueType[];
  halfValues: SingleValueType[];
  changeOnSelect?: boolean;
  onSelect: (valuePath: SingleValueType) => void;
  checkable?: boolean | RenderNode;
  searchOptions: DefaultOptionType[];
  popupPrefixCls?: string;
  loadData?: (selectOptions: DefaultOptionType[]) => void;
  expandTrigger?: 'hover' | 'click';
  expandIcon?: RenderNode;
  loadingIcon?: RenderNode;
  popupMenuColumnStyle?: CSSProperties;
  optionRender?: CascaderProps['optionRender'];
  classNames?: CascaderProps['classNames'];
  styles?: CascaderProps['styles'];
}

type NewType = CascaderContextProps;

const CascaderContext: InjectionKey<Reactive<NewType>> = Symbol('CascaderContext');

export const useCascaderContextInject = () => {
  return inject(CascaderContext, reactive({} as CascaderContextProps));
};

export const CascaderContextProvider = defineComponent(({ value }: { value: CascaderContextProps }) => {
  provide(
    CascaderContext,
    reactiveComputed(() => value),
  );
  return () => <slot></slot>;
});
