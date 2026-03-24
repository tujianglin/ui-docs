/* eslint-disable no-console */
import { defineComponent } from 'vue';
import { useNotification } from '../src';
import './assets/index.less';
import motion from './motion';

export default defineComponent(() => {
  const [notice, ContextHolder] = useNotification({ motion, maxCount: 3 });

  return () => (
    <>
      <button
        onClick={() => {
          notice.open({
            content: `${new Date().toISOString()}`,
          });
        }}
      >
        Max Count 3
      </button>
      <ContextHolder></ContextHolder>
    </>
  );
});
