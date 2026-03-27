import { clsx } from 'clsx';
import { computed, defineComponent, type CSSProperties } from 'vue';
import type { Status } from './Steps';

export interface RailProps {
  prefixCls: string;
  class: string;
  style: CSSProperties;
  status: Status;
}

const Rail = defineComponent(({ prefixCls, class: className, style, status }: RailProps) => {
  const railCls = computed(() => `${prefixCls}-rail`);

  // ============================= render =============================
  return () => <div class={clsx(railCls.value, `${railCls.value}-${status}`, className)} style={style} />;
});

export default Rail;
