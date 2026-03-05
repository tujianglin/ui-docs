/* eslint-disable no-console */
import Textarea from '@vc-com/textarea';
import { defineComponent, ref } from 'vue';
import './assets/index.less';

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
      <Textarea autoSize showCount />
      <p>controlled</p>
      <Textarea value={value.value} onChange={onChange} showCount maxlength={100} />
      <p>with height</p>
      <Textarea
        value={value.value}
        onChange={onChange}
        showCount
        style={{ height: '200px', width: '100%', resize: 'vertical' }}
      />
      <hr />
      <p>Count.exceedFormatter</p>
      <Textarea
        value="👨‍👨‍👧‍👦"
        count={{
          show: true,
          max: 5,
        }}
      />
      <Textarea
        value="🔥"
        count={{
          show: true,
          max: 5,
          exceedFormatter: (val, { max }) => {
            // @ts-ignore
            const segments = [...new Intl.Segmenter().segment(val)];

            return segments
              .filter((seg) => seg.index + seg.segment.length <= max)
              .map((seg) => seg.segment)
              .join('');
          },
        }}
      />
    </div>
  );
});
