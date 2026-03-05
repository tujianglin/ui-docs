/* eslint-disable no-console */
import type { TextAreaProps } from '@vc-com/textarea';
import Textarea from '@vc-com/textarea';
import { defineComponent, ref } from 'vue';

export default defineComponent(() => {
  const value = ref('');

  const onChange = (e) => {
    const {
      target: { value: currentValue },
    } = e;
    console.log(e.target.value);
    value.value = currentValue;
  };

  const onResize: TextAreaProps['onResize'] = ({ width, height }) => {
    console.log(`size is changed, width:${width} height:${height}`);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onPressEnter = () => {
    console.log(`enter key is pressed`);
  };

  return () => (
    <div>
      <Textarea
        prefixCls="custom-textarea"
        onPressEnter={onPressEnter}
        onResize={onResize}
        value={value.value}
        onChange={onChange}
        autofocus
        onFocus={() => console.log('focus')}
      />
    </div>
  );
});
