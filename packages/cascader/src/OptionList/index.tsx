import { useBaseSelectContextInject } from '@vc-com/select';
import type { RefOptionListProps } from '@vc-com/select/OptionList';
import { defineComponent, getCurrentInstance } from 'vue';
import RawOptionList from './List';

const RefOptionList = defineComponent((props: RefOptionListProps) => {
  const baseProps = useBaseSelectContextInject();
  const vm = getCurrentInstance();
  const changeRef = (el) => {
    vm.exposeProxy = el || {};
    vm.exposed = el || {};
  };
  // >>>>> Render
  return () => <RawOptionList {...props} {...baseProps} ref={changeRef} />;
});

export default RefOptionList;
