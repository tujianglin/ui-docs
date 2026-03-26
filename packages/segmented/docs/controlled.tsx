import { defineComponent, ref } from 'vue';
import Segmented from '../src';
import './assets/style.less';

export default defineComponent(() => {
  const value = ref('iOS');
  return () => (
    <>
      <Segmented options={['iOS', 'Android', 'Web3']} value={value.value} onChange={(val) => (value.value = val)} />
      &nbsp;&nbsp;
      <Segmented options={['iOS', 'Android', 'Web3']} value={value.value} onChange={(val) => (value.value = val)} />
    </>
  );
});
