import { reactiveComputed, type ReactiveComputedReturn } from '@vueuse/core';
import type { HTMLAttributes } from 'vue-jsx-vapor';
import { pickProps } from '../../../utils/miscUtil';

const propNames = ['onMouseenter', 'onMouseleave'] as const;

export default function useRootProps(props: ReactiveComputedReturn<HTMLAttributes<any>>) {
  return reactiveComputed(() => pickProps(props, propNames));
}
