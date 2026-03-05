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

  const onResize = ({ width, height }) => {
    console.log(`size is changed, width:${width} height:${height}`);
  };

  return () => (
    <div>
      <p>when set to true</p>
      <Textarea autoSize onResize={onResize} value={value.value} onChange={onChange} />
      <p>when set to object of minRows and maxRows</p>
      <Textarea autoSize={{ minRows: 5, maxRows: 15 }} onResize={onResize} value={value.value} onChange={onChange} />
    </div>
  );
});
