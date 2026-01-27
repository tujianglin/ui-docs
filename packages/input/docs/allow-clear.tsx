import Input from '@vc-com/input';
import { ref } from 'vue';
import type { ChangeEvent } from 'vue-jsx-vapor';
import './assets/index.less';

const Demo = () => {
  const value = ref<string>('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    value.value = e.target.value;
  };

  return (
    <div>
      <Input prefixCls="rc-input" allowClear placeholder="uncontrolled" />
      <br />
      <br />
      <Input
        prefixCls="rc-input"
        allowClear={{ clearIcon: '✖' }}
        onChange={handleChange}
        v-model:value={value.value}
        placeholder="controlled"
      />
    </div>
  );
};

export default Demo;
