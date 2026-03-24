/* eslint-disable no-console */
import { defineComponent } from 'vue';
import { useNotification } from '../src';
import './assets/index.less';
import motion from './motion';

const getConfig = () => ({
  content: `${Array(Math.round(Math.random() * 5) + 1)
    .fill(1)
    .map(() => new Date().toISOString())
    .join('\n')}`,
  duration: null,
});

const Demo = defineComponent(() => {
  const [{ open }, Holder] = useNotification({ motion, stack: true, closable: true });

  return () => (
    <>
      <button
        type="button"
        onClick={() => {
          open(getConfig());
        }}
      >
        Top Right
      </button>
      <button
        type="button"
        onClick={() => {
          open({ ...getConfig(), placement: 'bottomRight' });
        }}
      >
        Bottom Right
      </button>
      <Holder></Holder>
    </>
  );
});

export default Demo;
