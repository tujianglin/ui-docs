/* eslint-disable @typescript-eslint/no-unused-vars */
import Drawer from '@vc-com/drawer';
import { defineComponent, ref } from 'vue';
import motionProps from './motion';

const Demo = defineComponent(() => {
  const open = ref(false);
  const onTouchEnd = () => {
    open.value = false;
  };
  const onSwitch = () => {
    open.value = !open.value;
  };
  return () => (
    <div>
      <Drawer
        open={open.value}
        // defaultOpen
        onClose={onTouchEnd}
        afterOpenChange={(c: boolean) => {
          console.log('transitionEnd: ', c);
        }}
        placement="right"
        // width={400}
        width="60%"
        // Motion
        {...motionProps}
      >
        content
        <button>Button 1</button>
        <button>Button 2</button>
      </Drawer>
      <div>
        <button onClick={onSwitch}>打开</button>
      </div>
    </div>
  );
});
export default Demo;
