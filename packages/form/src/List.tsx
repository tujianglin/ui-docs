import { warning } from '@vc-com/util/lib/warning';
import { reactiveComputed } from '@vueuse/core';
import { computed, defineComponent, shallowRef } from 'vue';
import type { VueNode } from '../../util/src/types';
import Field from './Field';
import { useFieldContextInject, useFieldContextProvider } from './FieldContext';
import type { InternalFormInstance, InternalNamePath, Meta, NamePath, StoreValue, ValidatorRule } from './interface';
import { useListContextInject, useListContextProvider, type ListContextProps } from './ListContext';
import { getNamePath, move } from './utils/valueUtil';

export interface ListField {
  name: number;
  key: number;
  isListField: boolean;
}

export interface ListOperations {
  add: (defaultValue?: StoreValue, index?: number) => void;
  remove: (index: number | number[]) => void;
  move: (from: number, to: number) => void;
}

export interface ListProps<Values = any> {
  name: NamePath<Values>;
  rules?: ValidatorRule[];
  validateTrigger?: string | string[] | false;
  initialValue?: any[];
  children?: (fields: ListField[], operations: ListOperations, meta: Meta) => VueNode;

  /** @private Passed by Form.List props. Do not use since it will break by path check. */
  isListField?: boolean;
}

const List = defineComponent(
  ({ name, initialValue, children, rules, validateTrigger, isListField }: ListProps) => {
    const context = useFieldContextInject();
    const wrapperListContext = useListContextInject();
    const keyRef = shallowRef({ keys: [], id: 0 });

    const keyManager = computed(() => keyRef.value);

    const prefixName = computed<InternalNamePath>(() => {
      const parentPrefixName = getNamePath(context.prefixName) || [];
      return [...parentPrefixName, ...getNamePath(name)];
    });

    const fieldContext = reactiveComputed<InternalFormInstance>(() => ({ ...context, prefixName: prefixName.value }));

    // List context
    const listContext = computed<ListContextProps>(() => ({
      getKey: (namePath: InternalNamePath) => {
        const len = prefixName.value.length;
        const pathName = namePath[len];
        return [keyManager.value.keys[pathName], namePath.slice(len + 1)];
      },
    }));

    // User should not pass `children` as other type.
    if (typeof children !== 'function') {
      warning(false, 'Form.List only accepts function as children.');
      return null;
    }

    const shouldUpdate = (prevValue, nextValue, { source }: { source?: any }) => {
      if (source === 'internal') {
        return false;
      }
      return prevValue !== nextValue;
    };
    useListContextProvider(listContext.value);
    useFieldContextProvider(fieldContext);

    return () => (
      <Field
        name={[]}
        shouldUpdate={shouldUpdate}
        rules={rules}
        validateTrigger={validateTrigger}
        initialValue={initialValue}
        isList
        isListField={isListField ?? !!wrapperListContext}
      >
        {({ value = [], onChange, meta }) => {
          const { getFieldValue } = context;
          const getNewValue = () => {
            const values = getFieldValue(prefixName || []) as StoreValue[];
            return values || [];
          };
          /**
           * Always get latest value in case user update fields by `form` api.
           */
          const operations: ListOperations = {
            add: (defaultValue, index?: number) => {
              // Mapping keys
              const newValue = getNewValue();

              if (index >= 0 && index <= newValue.length) {
                keyManager.value.keys = [
                  ...keyManager.value.keys.slice(0, index),
                  keyManager.value.id,
                  ...keyManager.value.keys.slice(index),
                ];
                onChange([...newValue.slice(0, index), defaultValue, ...newValue.slice(index)]);
              } else {
                if (process.env.NODE_ENV !== 'production' && (index < 0 || index > newValue.length)) {
                  warning(false, 'The second parameter of the add function should be a valid positive number.');
                }
                keyManager.value.keys = [...keyManager.value.keys, keyManager.value.id];
                onChange([...newValue, defaultValue]);
              }
              keyManager.value.id += 1;
            },
            remove: (index: number | number[]) => {
              const newValue = getNewValue();
              const indexSet = new Set(Array.isArray(index) ? index : [index]);

              if (indexSet.size <= 0) {
                return;
              }
              keyManager.value.keys = keyManager.value.keys.filter((_, keysIndex) => !indexSet.has(keysIndex));

              // Trigger store change
              onChange(newValue.filter((_, valueIndex) => !indexSet.has(valueIndex)));
            },
            move(from: number, to: number) {
              if (from === to) {
                return;
              }
              const newValue = getNewValue();

              // Do not handle out of range
              if (from < 0 || from >= newValue.length || to < 0 || to >= newValue.length) {
                return;
              }

              keyManager.value.keys = move(keyManager.value.keys, from, to);

              // Trigger store change
              onChange(move(newValue, from, to));
            },
          };

          let listValue = value || [];
          if (!Array.isArray(listValue)) {
            listValue = [];

            if (process.env.NODE_ENV !== 'production') {
              warning(false, `Current value of '${prefixName.value.join(' > ')}' is not an array type.`);
            }
          }

          return children(
            (listValue as StoreValue[]).map((__, index): ListField => {
              let key = keyManager.value.keys[index];
              if (key === undefined) {
                keyManager.value.keys[index] = keyManager.value.id;
                key = keyManager.value.keys[index];
                keyManager.value.id += 1;
              }

              return {
                name: index,
                key,
                isListField: true,
              };
            }),
            operations,
            meta,
          );
        }}
      </Field>
    );
  },
  { inheritAttrs: false },
);

export default List;
