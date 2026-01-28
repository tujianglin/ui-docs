import { reactiveComputed } from '@vueuse/core';
import { defineComponent, inject, provide, reactive, type CSSProperties, type InjectionKey, type Reactive } from 'vue';
import type { RawValueType, RenderNode } from './BaseSelect';
import type {
  BaseOptionType,
  FieldNames,
  OnActiveValue,
  OnInternalSelect,
  PopupSemantic,
  SelectProps,
  SemanticName,
} from './Select';
import type { FlattenOptionData } from './interface';

// Use any here since we do not get the type during compilation
/**
 * SelectContext is only used for Select. BaseSelect should not consume this context.
 */
export interface SelectContextProps {
  classNames?: Partial<Record<SemanticName, string>> & {
    popup?: Partial<Record<PopupSemantic, string>>;
  };
  styles?: Partial<Record<SemanticName, CSSProperties>> & {
    popup?: Partial<Record<PopupSemantic, CSSProperties>>;
  };
  options: BaseOptionType[];
  optionRender?: SelectProps['optionRender'];
  flattenOptions: FlattenOptionData<BaseOptionType>[];
  onActiveValue: OnActiveValue;
  defaultActiveFirstOption?: boolean;
  onSelect: OnInternalSelect;
  menuItemSelectedIcon?: RenderNode;
  rawValues: Set<RawValueType>;
  fieldNames?: FieldNames;
  virtual?: boolean;
  direction?: 'ltr' | 'rtl';
  listHeight?: number;
  listItemHeight?: number;
  childrenAsData?: boolean;
  maxCount?: number;
}

const SelectContext: InjectionKey<Reactive<SelectContextProps>> = Symbol('SelectContext');

export const useSelectContextInject = () => {
  return inject(SelectContext, reactive({} as SelectContextProps));
};

export const SelectContextProvider = defineComponent(({ value }: { value: SelectContextProps }) => {
  const slots = defineSlots({
    default: () => <></>,
  });
  provide(
    SelectContext,
    reactiveComputed(() => value),
  );
  return () => <slots.default />;
});
