import { reactiveComputed } from '@vueuse/core';
import { computed, defineComponent, onBeforeUnmount, ref, shallowRef, watch, watchEffect } from 'vue';
import { useRef, type FormEvent, type FormHTMLAttributes } from 'vue-jsx-vapor';
import { HOOK_MARK, useFieldContextProvider } from './FieldContext';
import { useFormContextInject } from './FormContext';
import useForm from './hooks/useForm';
import type { Callbacks, FieldData, FormInstance, InternalFormInstance, Store, ValidateMessages } from './interface';
import { useListContextProvider } from './ListContext';
import { isSimilar } from './utils/valueUtil';

type BaseFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'children'>;

export interface FormProps<Values = any> extends BaseFormProps {
  initialValues?: Store;
  form?: FormInstance<Values>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: any;
  fields?: FieldData[];
  name?: string;
  validateMessages?: ValidateMessages;
  onValuesChange?: Callbacks<Values>['onValuesChange'];
  onFieldsChange?: Callbacks<Values>['onFieldsChange'];
  onFinish?: Callbacks<Values>['onFinish'];
  onFinishFailed?: Callbacks<Values>['onFinishFailed'];
  validateTrigger?: string | string[] | false;
  preserve?: boolean;
  clearOnDestroy?: boolean;
}

const Form = defineComponent(
  ({
    name,
    initialValues,
    fields,
    form,
    preserve,
    component,
    validateMessages,
    validateTrigger = 'onChange',
    onValuesChange,
    onFieldsChange,
    onFinish,
    onFinishFailed,
    clearOnDestroy,
    ...restProps
  }: FormProps) => {
    const Component = computed(() => component ?? 'form');
    const nativeElementRef = useRef<HTMLFormElement>(null);
    const formContext = useFormContextInject();

    // We customize handle event since Context will makes all the consumer re-render:
    // https://reactjs.org/docs/context.html#contextprovider
    const [formInstance] = useForm(form);
    const { useSubscribe, setInitialValues, setCallbacks, setValidateMessages, setPreserve, destroyForm } = (
      formInstance as InternalFormInstance
    ).getInternalHooks(HOOK_MARK);

    // Pass ref with form instance
    defineExpose({
      ...formInstance,
      get nativeElement() {
        return nativeElementRef.value;
      },
    });

    // Register form into Context
    watch(
      () => [formContext, formInstance, name],
      (_n, _o, onCleanup) => {
        formContext.registerForm(name, formInstance);
        onCleanup(() => {
          formContext.unregisterForm(name);
        });
      },
      { immediate: true, deep: true },
    );

    // Pass props to store
    watchEffect(() => {
      setValidateMessages({
        ...formContext.validateMessages,
        ...validateMessages,
      });
    });
    watchEffect(() => {
      setCallbacks({
        onValuesChange,
        onFieldsChange: (changedFields: FieldData[], ...rest) => {
          formContext.triggerFormChange(name, changedFields);

          if (onFieldsChange) {
            onFieldsChange(changedFields, ...rest);
          }
        },
        onFinish: (values: Store) => {
          formContext.triggerFormFinish(name, values);

          if (onFinish) {
            onFinish(values);
          }
        },
        onFinishFailed,
      });
    });

    watchEffect(() => {
      setPreserve(preserve);
    });
    // Set initial value, init store value when first mount
    const mountRef = ref(false);
    watch(
      () => initialValues,
      () => {
        setInitialValues(initialValues, !mountRef.value);
        if (!mountRef.value) {
          mountRef.value = true;
        }
      },
      { immediate: true, deep: true },
    );

    // ========================== Unmount ===========================
    onBeforeUnmount(() => destroyForm(clearOnDestroy));

    // Not use subscribe when using render props
    useSubscribe(true);

    // Listen if fields provided. We use ref to save prev data here to avoid additional render
    const prevFieldsRef = shallowRef<FieldData[] | undefined>(null);
    watch(
      () => [fields, formInstance],
      () => {
        if (!isSimilar(prevFieldsRef.value || [], fields || [])) {
          formInstance.setFields(fields || []);
        }
        prevFieldsRef.value = fields;
      },
      { immediate: true, deep: true },
    );

    // =========================== Render ===========================
    const formContextValue = reactiveComputed<InternalFormInstance>(() => ({
      ...(formInstance as InternalFormInstance),
      validateTrigger,
    }));

    useListContextProvider(null);
    useFieldContextProvider(formContextValue);

    return () => {
      if (Component.value === false) {
        return <slot></slot>;
      }

      return (
        <Component.value
          {...restProps}
          ref={nativeElementRef}
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            event.stopPropagation();

            formInstance.submit();
          }}
          onReset={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            formInstance.resetFields();
            restProps.onReset?.(event);
          }}
        >
          <slot></slot>
        </Component.value>
      );
    };
  },
);

export default Form;
