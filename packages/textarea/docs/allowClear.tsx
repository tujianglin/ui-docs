/* eslint-disable no-console */
import Textarea from '@vc-com/textarea';
import { defineComponent, ref } from 'vue';

export default defineComponent(() => {
  const value = ref('hello\nworld');

  const onChange = (e) => {
    const {
      target: { value: currentValue },
    } = e;
    value.value = currentValue;
  };

  return () => (
    <div>
      <p>Uncontrolled</p>
      <Textarea autoSize allowClear />
      <p>controlled</p>
      <Textarea value={value.value} onChange={onChange} allowClear />
    </div>
  );
});
