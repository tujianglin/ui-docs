/* eslint-disable no-console */
import { defineComponent } from 'vue';
import { useNotification } from '../src';
import './assets/index.less';
import motion from './motion';

export default defineComponent(() => {
  const [notice, ContextHolder] = useNotification({ motion, showProgress: true });

  return () => (
    <>
      <button
        onClick={() => {
          notice.open({
            content: `${new Date().toISOString()}`,
          });
        }}
      >
        Show With Progress
      </button>
      <button
        onClick={() => {
          notice.open({
            content: `${new Date().toISOString()}`,
            pauseOnHover: false,
          });
        }}
      >
        Not Pause On Hover
      </button>
      <ContextHolder></ContextHolder>
    </>
  );
});
