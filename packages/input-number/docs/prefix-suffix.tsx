/* eslint no-console:0 */
import InputNumber from '@vc-com/input-number';
import { defineComponent, ref } from 'vue';
import './assets/index.less';

export default defineComponent(() => {
  const value = ref<string | number>(100);

  const onChange = (val) => {
    console.log('onChange:', val, typeof val);
    value.value = val;
  };

  return () => (
    <div style={{ margin: '10px' }}>
      <InputNumber style={{ width: '200px' }} value={value.value} onChange={onChange} prefix="¥" suffix="RMB" />
    </div>
  );
});
