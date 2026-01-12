import { warning } from '@vc-com/util/lib/warning';
import { defineComponent, type VNodeChild } from 'vue';
import type { InputHTMLAttributes } from 'vue-jsx-vapor';
export type Props = {
  /** The count */
  count?: number;
  flag?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

export default defineComponent(({ count, flag, ...props }: Props) => {
  const value = defineModel('value');
  const slots = defineSlots<{
    title?: () => VNodeChild | JSX.Element;
  }>();
  warning(false, '11111111');
  return () => (
    <>
      <div>{slots?.title?.()}</div>
      <input {...props} v-model={value.value} type="text" />
      {count}
      {flag + '1'}
    </>
  );
});
