import isEqual from '@vc-com/util/lib/isEqual';
import { warning } from '@vc-com/util/lib/warning';
import { computed, defineComponent, Fragment, onBeforeUnmount, onMounted, ref } from 'vue';
import { filterEmpty } from '../../util/src/props-util';
import { HOOK_MARK, useFieldContextInject } from './FieldContext';
import type {
  EventArgs,
  FieldEntity,
  FormInstance,
  InternalFormInstance,
  InternalNamePath,
  InternalValidateOptions,
  Meta,
  NamePath,
  NotifyInfo,
  Rule,
  RuleError,
  RuleObject,
  Store,
  StoreValue,
} from './interface';
import { useListContextInject } from './ListContext';
import { toArray } from './utils/typeUtil';
import { validateRules } from './utils/validateUtil';
import {
  containsNamePath,
  defaultGetValueFromEvent,
  getNamePath,
  getNamePath as getPath,
  getValue,
  matchNamePath,
} from './utils/valueUtil';

const EMPTY_ERRORS: any[] = [];
const EMPTY_WARNINGS: any[] = [];

export type ShouldUpdate<Values = any> =
  | boolean
  | ((prevValues: Values, nextValues: Values, info: { source?: string }) => boolean);

function requireUpdate(
  shouldUpdate: ShouldUpdate,
  prev: StoreValue,
  next: StoreValue,
  prevValue: StoreValue,
  nextValue: StoreValue,
  info: NotifyInfo,
): boolean {
  if (typeof shouldUpdate === 'function') {
    return shouldUpdate(prev, next, 'source' in info ? { source: info.source } : {});
  }
  return prevValue !== nextValue;
}

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
interface ChildProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: any;
}

export type MetaEvent = Meta & { destroy?: boolean };

export interface InternalFieldProps<Values = any> {
  /**
   * Set up `dependencies` field.
   * When dependencies field update and current field is touched,
   * will trigger validate rules and render.
   */
  dependencies?: NamePath[];
  getValueFromEvent?: (...args: EventArgs) => StoreValue;
  name?: InternalNamePath;
  normalize?: (value: StoreValue, prevValue: StoreValue, allValues: Store) => StoreValue;
  rules?: Rule[];
  shouldUpdate?: ShouldUpdate<Values>;
  trigger?: string;
  validateTrigger?: string | string[] | false;
  /**
   * Trigger will after configured milliseconds.
   */
  validateDebounce?: number;
  validateFirst?: boolean | 'parallel';
  valuePropName?: string;
  getValueProps?: (value: StoreValue) => Record<string, unknown>;
  messageVariables?: Record<string, string>;
  initialValue?: any;
  onReset?: () => void;
  onMetaChange?: (meta: MetaEvent) => void;
  preserve?: boolean;

  /** @private Passed by Form.List props. Do not use since it will break by path check. */
  isListField?: boolean;

  /** @private Passed by Form.List props. Do not use since it will break by path check. */
  isList?: boolean;

  /** @private Pass context as prop instead of context api
   *  since class component can not get context in constructor */
  fieldContext?: InternalFormInstance;
}

export interface FieldProps<Values = any> extends Omit<InternalFieldProps<Values>, 'name' | 'fieldContext'> {
  name?: NamePath<Values>;
}

export interface FieldState {
  resetCount: number;
}

// We use Class instead of Hooks here since it will cost much code by using Hooks.
const Field = defineComponent(
  (props: InternalFieldProps) => {
    const injectedFieldContext = useFieldContextInject();

    // Unref to get actual value (handles both Ref and ComputedRef)
    const fieldContext = computed(() => props.fieldContext || injectedFieldContext);

    // State
    const resetCount = ref(0);
    const forceUpdate = ref(0);
    const mounted = ref(false);

    // Internal state (不使用响应式，因为需要同步更新)
    let touched = false;
    let dirty = false;
    let validatePromise: Promise<string[]> | null = null;
    let prevValidating = false;
    let errors: string[] = EMPTY_ERRORS;
    let warnings: string[] = EMPTY_WARNINGS;
    let metaCache: MetaEvent | null = null;
    let cancelRegisterFunc: ((isListField?: boolean, preserve?: boolean, namePath?: InternalNamePath) => void) | null = null;

    // ================================== Utils ==================================
    const getNamePath = (): InternalNamePath => {
      const { name, fieldContext } = props;
      const { prefixName = [] }: InternalFormInstance = fieldContext;

      return name !== undefined ? [...prefixName, ...name] : [];
    };

    const getRules = (): RuleObject[] => {
      const { rules = [] } = props;
      const ctx = fieldContext.value;
      return rules.map((rule: Rule): RuleObject => {
        if (typeof rule === 'function') {
          return rule(ctx);
        }
        return rule;
      });
    };

    const reRender = () => {
      if (!mounted.value) return;
      forceUpdate.value++;
    };

    const refresh = () => {
      if (!mounted.value) return;
      resetCount.value++;
    };

    // ================================== Helper Functions ==================================
    // These must be defined before triggerMetaEvent
    const isFieldValidating = () => !!validatePromise;
    const isFieldTouched = () => touched;
    const isFieldDirty = () => {
      if (dirty || props.initialValue !== undefined) {
        return true;
      }
      const ctx = fieldContext.value;
      const { getInitialValue } = ctx.getInternalHooks(HOOK_MARK);
      if (getInitialValue(getNamePath()) !== undefined) {
        return true;
      }
      return false;
    };

    const getMeta = (): Meta => {
      prevValidating = isFieldValidating();
      const meta: Meta = {
        touched: isFieldTouched(),
        validating: prevValidating,
        errors,
        warnings,
        name: getNamePath(),
        validated: validatePromise === null,
      };
      return meta;
    };

    const getValueFromStore = (store?: Store) => {
      const ctx = fieldContext.value;
      const { getFieldsValue } = ctx;
      const namePath = getNamePath();
      return getValue(store || getFieldsValue(true), namePath);
    };

    // Event should only trigger when meta changed
    const triggerMetaEvent = (destroy?: boolean) => {
      const { onMetaChange } = props;

      if (onMetaChange) {
        const meta = { ...getMeta(), destroy };

        if (!isEqual(metaCache, meta)) {
          onMetaChange(meta);
        }

        metaCache = meta;
      } else {
        metaCache = null;
      }
    };

    // ========================= Field Entity Interfaces =========================
    const onStoreChange: FieldEntity['onStoreChange'] = (prevStore, namePathList, info) => {
      const { shouldUpdate, dependencies = [], onReset } = props;
      const { store } = info;
      const namePath = getNamePath();
      const prevValue = getValueFromStore(prevStore);
      const curValue = getValueFromStore(store);

      const namePathMatch = namePathList && containsNamePath(namePathList, namePath);

      // Skip reRender if value changed from something to undefined
      // This prevents unmounting fields (e.g. list items being removed) from interfering
      if (info.type === 'valueUpdate' && curValue === undefined && prevValue !== undefined && namePath.length > 0) {
        return;
      }

      // `setFieldsValue` is a quick access to update related status
      if (info.type === 'valueUpdate' && info.source === 'external' && !isEqual(prevValue, curValue)) {
        touched = true;
        dirty = true;
        validatePromise = null;
        errors = EMPTY_ERRORS;
        warnings = EMPTY_WARNINGS;
        refresh();
        triggerMetaEvent();
        reRender();
      }

      switch (info.type) {
        case 'reset':
          if (!namePathList || namePathMatch) {
            // Clean up state
            touched = false;
            dirty = false;
            validatePromise = undefined;
            errors = EMPTY_ERRORS;
            warnings = EMPTY_WARNINGS;
            triggerMetaEvent();

            onReset?.();

            // Use reRender instead of refresh to trigger UI update
            reRender();
            return;
          }
          break;

        case 'remove': {
          if (shouldUpdate && requireUpdate(shouldUpdate, prevStore, store, prevValue, curValue, info)) {
            reRender();
            return;
          }
          break;
        }

        case 'setField': {
          const { data } = info;
          if (namePathMatch) {
            if ('touched' in data) {
              touched = data.touched;
            }
            if ('validating' in data && !('originRCField' in data)) {
              validatePromise = data.validating ? Promise.resolve([]) : null;
            }
            if ('errors' in data) {
              errors = data.errors || EMPTY_ERRORS;
            }
            if ('warnings' in data) {
              warnings = data.warnings || EMPTY_WARNINGS;
            }
            dirty = true;

            triggerMetaEvent();

            reRender();
            return;
          } else if ('value' in data && containsNamePath(namePathList, namePath, true)) {
            // Contains path with value should also check
            reRender();
            return;
          }

          // Handle update by `setField` with `shouldUpdate`
          if (shouldUpdate && !namePath.length && requireUpdate(shouldUpdate, prevStore, store, prevValue, curValue, info)) {
            reRender();
            return;
          }
          break;
        }

        case 'dependenciesUpdate': {
          const dependencyList = dependencies.map(getPath);

          // Helper function to compare name paths
          const namePathEqual = (a: InternalNamePath, b: InternalNamePath): boolean => {
            if (a.length !== b.length) return false;
            return a.every((val, idx) => val === b[idx]);
          };

          // Check if any dependency matches any related field
          const hasMatch = dependencyList.some((dependency) => {
            if (!info.relatedFields) return false;
            return info.relatedFields.some((relatedField) => {
              // Try multiple matching strategies
              const exactMatch = matchNamePath(relatedField, dependency, false);
              const partialMatch = matchNamePath(relatedField, dependency, true);
              const directEqual = namePathEqual(relatedField, dependency);
              return exactMatch || partialMatch || directEqual;
            });
          });
          if (hasMatch) {
            reRender();
            return;
          }
          break;
        }

        default:
          // For fields with dependencies but no name, check if any dependency changed
          if (!namePath.length && dependencies.length) {
            const dependencyList = dependencies.map(getPath);
            const dependencyChanged = dependencyList.some(
              (dependency) => namePathList && containsNamePath(namePathList, dependency),
            );

            if (dependencyChanged) {
              reRender();
              return;
            }
          }

          if (
            namePathMatch ||
            ((!dependencies.length || namePath.length || shouldUpdate) &&
              requireUpdate(shouldUpdate, prevStore, store, prevValue, curValue, info))
          ) {
            reRender();
            return;
          }
          break;
      }

      if (shouldUpdate === true) {
        reRender();
      }
    };

    const validateRulesFunc = (options?: InternalValidateOptions): Promise<RuleError[]> => {
      const namePath = getNamePath();
      const currentValue = getValueFromStore();

      const { triggerName, validateOnly = false } = options || {};

      const rootPromise = Promise.resolve().then(async (): Promise<any[]> => {
        if (!mounted.value) {
          return [];
        }

        const { validateFirst = false, messageVariables, validateDebounce } = props;

        let filteredRules = getRules();
        if (triggerName) {
          filteredRules = filteredRules
            .filter((rule) => rule)
            .filter((rule: RuleObject) => {
              const { validateTrigger } = rule;
              if (!validateTrigger) {
                return true;
              }
              const triggerList = toArray(validateTrigger);
              return triggerList.includes(triggerName);
            });
        }

        // Wait for debounce
        if (validateDebounce && triggerName) {
          await new Promise((resolve) => {
            setTimeout(resolve, validateDebounce);
          });

          if (validatePromise !== rootPromise) {
            return [];
          }
        }

        const promise = validateRules(namePath, currentValue, filteredRules, options, validateFirst, messageVariables);

        promise
          .catch((e) => e)
          .then((ruleErrors: RuleError[] = EMPTY_ERRORS) => {
            if (validatePromise === rootPromise) {
              validatePromise = null;

              const nextErrors: string[] = [];
              const nextWarnings: string[] = [];
              ruleErrors.forEach?.(({ rule: { warningOnly }, errors: errs = EMPTY_ERRORS }) => {
                if (warningOnly) {
                  nextWarnings.push(...errs);
                } else {
                  nextErrors.push(...errs);
                }
              });

              errors = nextErrors;
              warnings = nextWarnings;
              triggerMetaEvent();

              reRender();
            }
          });

        return promise;
      });

      if (validateOnly) {
        return rootPromise;
      }

      validatePromise = rootPromise;
      dirty = true;
      errors = EMPTY_ERRORS;
      warnings = EMPTY_WARNINGS;
      triggerMetaEvent();

      // Trigger re-render to update meta.validating
      reRender();

      return rootPromise;
    };

    const getErrors = () => errors;

    const getWarnings = () => warnings;

    const isListField = () => props.isListField;

    const isList = () => props.isList;

    const isPreserve = () => props.preserve;

    const getControlled = (childProps: ChildProps = {}) => {
      const {
        name,
        trigger = 'onChange',
        validateTrigger = undefined,
        getValueFromEvent,
        normalize,
        valuePropName = 'value',
        getValueProps,
      } = props;

      const ctx = fieldContext.value;
      const mergedValidateTrigger = validateTrigger !== undefined ? validateTrigger : ctx.validateTrigger;

      const namePath = getNamePath();
      const { getInternalHooks, getFieldsValue } = ctx;
      const { dispatch } = getInternalHooks(HOOK_MARK);
      const value = getValueFromStore();
      const mergedGetValueProps = getValueProps || ((val: StoreValue) => ({ [valuePropName]: val }));

      const originTriggerFunc = childProps[trigger];

      const valueProps = name !== undefined ? mergedGetValueProps(value) : {};

      // warning when prop value is function
      if (process.env.NODE_ENV !== 'production' && valueProps) {
        Object.keys(valueProps).forEach((key) => {
          warning(
            typeof valueProps[key] !== 'function',
            `It's not recommended to generate dynamic function prop by \`getValueProps\`. Please pass it to child component directly (prop: ${key})`,
          );
        });
      }

      const control = {
        ...childProps,
        ...valueProps,
      };

      // Add trigger

      control[trigger] = (...args: EventArgs) => {
        touched = true;
        dirty = true;

        triggerMetaEvent();

        // Trigger re-render to update meta in child component
        reRender();

        let newValue: StoreValue;
        if (getValueFromEvent) {
          newValue = getValueFromEvent(...args);
        } else {
          newValue = defaultGetValueFromEvent(valuePropName, ...args);
        }

        if (normalize) {
          newValue = normalize(newValue, value, getFieldsValue(true));
        }
        dispatch({
          type: 'updateValue',
          namePath,
          value: newValue,
        });
        if (originTriggerFunc) {
          originTriggerFunc(...args);
        }
      };

      // Add validateTrigger
      const validateTriggerList: string[] = toArray(mergedValidateTrigger || []);

      validateTriggerList.forEach((triggerName: string) => {
        const originTrigger = control[triggerName];
        control[triggerName] = (...args: EventArgs) => {
          if (originTrigger) {
            originTrigger(...args);
          }

          const { rules } = props;
          if (rules && rules.length) {
            dispatch({
              type: 'validateField',
              namePath,
              triggerName,
            });
          }
        };
      });

      return control;
    };

    const cancelRegister = () => {
      const { preserve, isListField, name } = props;

      if (cancelRegisterFunc) {
        cancelRegisterFunc(isListField, preserve, getPath(name));
      }
      cancelRegisterFunc = null;
    };

    // Field Entity
    const fieldEntity: FieldEntity = {
      onStoreChange,
      isFieldTouched,
      isFieldDirty,
      isFieldValidating,
      isListField,
      isList,
      isPreserve,
      validateRules: validateRulesFunc,
      getMeta,
      getNamePath,
      getErrors,
      getWarnings,
      props,
    };

    // ============================== Lifecycle ==============================
    // Register on init
    const ctx = fieldContext.value;
    if (ctx) {
      const { getInternalHooks } = ctx;
      const { initEntityValue } = getInternalHooks(HOOK_MARK);
      initEntityValue(fieldEntity);
    }

    onMounted(() => {
      const { shouldUpdate } = props;

      mounted.value = true;

      const ctx = fieldContext.value;
      if (ctx) {
        const { getInternalHooks } = ctx;
        const { registerField } = getInternalHooks(HOOK_MARK);
        cancelRegisterFunc = registerField(fieldEntity);
      }

      if (shouldUpdate === true) {
        reRender();
      }
    });

    onBeforeUnmount(() => {
      cancelRegister();
      triggerMetaEvent(true);
      mounted.value = false;
    });

    const slots = defineSlots<{
      default: (props?: { control: ChildProps; meta: Meta; form: FormInstance }) => any;
    }>();

    // ============================== Render ==============================
    return () => {
      // 触发 forceUpdate (使用副作用)
      void forceUpdate.value;

      const children = filterEmpty(slots.default?.())?.[0];
      if (!children) {
        return null;
      }
      // Support render function with meta callback
      const meta = getMeta();
      const control = getControlled();
      // Call slot function - always pass control, meta, form
      // The slot will decide whether to use them (render function) or ignore them (component)
      return (
        <Fragment key={resetCount.value}>
          <slot {...{ ...control, meta, form: fieldContext.value }}></slot>
        </Fragment>
      );
    };
  },
  { inheritAttrs: false },
);

const WrapperField = defineComponent(
  ({ name, ...restProps }: FieldProps) => {
    const fieldContext = useFieldContextInject();
    const listContext = useListContextInject();
    const namePath = computed(() => (name !== undefined ? getNamePath(name) : undefined));

    const isMergedListField = computed(() => restProps.isListField ?? !!listContext);

    const key = computed(() => {
      let result: string = 'keep';
      if (!isMergedListField.value) {
        result = `_${(namePath.value || []).join('_')}`;
      }
      return result;
    });

    // Warning if it's a directly list field.
    // We can still support multiple level field preserve.
    if (
      process.env.NODE_ENV !== 'production' &&
      restProps.preserve === false &&
      isMergedListField &&
      namePath.value.length <= 1
    ) {
      warning(false, '`preserve` should not apply on Form.List fields.');
    }

    return () => (
      <Field
        key={key.value}
        name={namePath.value}
        isListField={isMergedListField.value}
        {...restProps}
        fieldContext={fieldContext}
      >
        {(props) => <slot key={key.value} {...props}></slot>}
      </Field>
    );
  },
  { inheritAttrs: false },
);

export default WrapperField;
