import CSSMotion from '@vc-com/motion';
import clsx from 'clsx';
import { defineComponent, ref } from 'vue';
import './debug.less';

export default defineComponent(() => {
  const onCollapse = () => {
    console.log('🔥 Collapse');
    return { height: '0px' };
  };

  const onExpand = (node: HTMLElement) => {
    console.log('🔥 Expand');
    return { height: `${node.scrollHeight}px` };
  };

  const key = ref(0);

  return () => (
    <div>
      <button
        onClick={() => {
          key.value += 1;
        }}
      >
        Start
      </button>

      <CSSMotion
        visible
        motionName="debug-motion"
        motionAppear
        onAppearStart={onCollapse}
        onAppearActive={onExpand}
        key={key.value}
      >
        {({ style, class: className, ref }) => {
          console.log('render', className, style);

          return (
            <div ref={ref} class={clsx('debug-demo-block', className)} style={style}>
              <div
                style={{
                  height: '100px',
                  width: '100px',
                  background: 'blue',
                }}
              />
            </div>
          );
        }}
      </CSSMotion>
    </div>
  );
});
