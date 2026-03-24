/* eslint-disable no-console */
import { defineComponent } from 'vue';
import { useNotification } from '../src';
import './assets/index.less';
import motion from './motion';

const NOTICE = {
  content: <span>simple show</span>,
  onClose() {
    console.log('simple close');
  },
  // duration: null,
};

const Demo = defineComponent(() => {
  const [{ open }, Holder] = useNotification({ motion });

  return () => (
    <>
      <button
        type="button"
        onClick={() => {
          open({
            ...NOTICE,
            content: '11111',
            props: {
              'data-testid': 'my-data-testid',
            },
          });
        }}
      >
        simple show
      </button>
      <Holder></Holder>
    </>
  );
});

export default Demo;
