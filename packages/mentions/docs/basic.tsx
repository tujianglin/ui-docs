import Mentions from '@vc-com/mentions';
import { defineComponent } from 'vue';
import './assets/index.less';

const onSelect = (option, prefix) => {
  console.log('Select:', prefix, '-', option.value);
};

const onFocus = () => {
  console.log('onFocus');
};

const onBlur = () => {
  console.log('onBlur');
};

export default defineComponent(() => {
  return () => (
    <Mentions
      autofocus
      rows={3}
      defaultValue="Hello World"
      onSelect={onSelect}
      onFocus={onFocus}
      onBlur={onBlur}
      options={[
        {
          value: 'light',
          label: 'Light',
        },
        {
          value: 'bamboo',
          label: 'Bamboo',
        },
        {
          value: 'cat',
          label: 'Cat',
        },
      ]}
    />
  );
});
