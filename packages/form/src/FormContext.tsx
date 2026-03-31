import { reactiveComputed } from '@vueuse/core';
import { defineComponent, inject, provide, reactive, type InjectionKey, type Reactive } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import type { FieldData, FormInstance, Store, ValidateMessages } from './interface';

export type Forms = Record<string, FormInstance>;

export interface FormChangeInfo {
  changedFields: FieldData[];
  forms: Forms;
}

export interface FormFinishInfo {
  values: Store;
  forms: Forms;
}

export interface FormProviderProps {
  validateMessages?: ValidateMessages;
  onFormChange?: (name: string, info: FormChangeInfo) => void;
  onFormFinish?: (name: string, info: FormFinishInfo) => void;
}

export interface FormContextProps extends FormProviderProps {
  triggerFormChange: (name: string, changedFields: FieldData[]) => void;
  triggerFormFinish: (name: string, values: Store) => void;
  registerForm: (name: string, form: FormInstance) => void;
  unregisterForm: (name: string) => void;
}

const FormContext: InjectionKey<FormContextProps> = Symbol('FormContext');

export const useFormContextInject = (): FormContextProps => {
  return inject(
    FormContext,
    reactive({
      triggerFormChange: () => {},
      triggerFormFinish: () => {},
      registerForm: () => {},
      unregisterForm: () => {},
    }) as FormContextProps,
  );
};

export const useFormContextProvider = (form: Reactive<FormContextProps>) => {
  provide(FormContext, form);
};
const FormProvider = defineComponent(({ validateMessages, onFormChange, onFormFinish }: FormProviderProps) => {
  const formContext = useFormContextInject();

  const formsRef = useRef<Forms>({});

  useFormContextProvider(
    reactiveComputed(() => ({
      ...formContext,
      validateMessages: {
        ...formContext.validateMessages,
        ...validateMessages,
      },

      // =========================================================
      // =                  Global Form Control                  =
      // =========================================================
      triggerFormChange: (name, changedFields) => {
        if (onFormChange) {
          onFormChange(name, {
            changedFields,
            forms: formsRef.value,
          });
        }

        formContext.triggerFormChange(name, changedFields);
      },
      triggerFormFinish: (name, values) => {
        if (onFormFinish) {
          onFormFinish(name, {
            values,
            forms: formsRef.value,
          });
        }

        formContext.triggerFormFinish(name, values);
      },
      registerForm: (name, form) => {
        if (name) {
          formsRef.value = {
            ...formsRef.value,
            [name]: form,
          };
        }

        formContext.registerForm(name, form);
      },
      unregisterForm: (name) => {
        const newForms = { ...formsRef.value };
        delete newForms[name];
        formsRef.value = newForms;

        formContext.unregisterForm(name);
      },
    })),
  );
  return () => <slot></slot>;
});

export { FormProvider };
