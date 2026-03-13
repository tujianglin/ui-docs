import type { RenderNode } from '@vc-com/util/lib/types';
import { defineComponent, type CSSProperties } from 'vue';

export interface OptionProps {
  value?: string;
  key?: string;
  disabled?: boolean;
  children?: RenderNode;
  class?: string;
  style?: CSSProperties;
}

const Option = defineComponent((_props: OptionProps) => {
  return () => null;
});

export default Option;
