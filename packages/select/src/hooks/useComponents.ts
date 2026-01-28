import { computed, type ComputedRef, type Ref } from 'vue';
import type { BaseSelectProps } from '../BaseSelect';

export interface ComponentsConfig {
  root?: any;
  input?: any;
}

export interface FilledComponentsConfig {
  root: any;
  input: any;
}

export default function useComponents(
  components?: Ref<ComponentsConfig>,
  getInputElement?: Ref<BaseSelectProps['getInputElement']>,
  getRawInputElement?: Ref<BaseSelectProps['getRawInputElement']>,
): ComputedRef<ComponentsConfig> {
  return computed(() => {
    let { root, input } = components.value || {};

    // root: getRawInputElement
    if (getRawInputElement?.value) {
      root = getRawInputElement.value?.();
    }

    // input: getInputElement
    if (getInputElement?.value) {
      input = getInputElement.value?.();
    }

    return {
      root,
      input,
    };
  });
}
