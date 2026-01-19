import CSSMotion from '@vc-com/motion';
import clsx from 'clsx';
import { defineComponent, ref } from 'vue';
import './basic.less';

export default defineComponent(() => {
  const show = ref(true);

  const onTrigger = () => {
    show.value = !show.value;
  };

  const onStart = (ele: HTMLElement, event: object) => {
    console.log('start!', ele, event);
  };

  const onEnd = (ele: HTMLElement, event: object) => {
    console.log('end!', ele, event);
  };
  return () => (
    <div>
      <label>
        <input type="checkbox" onChange={onTrigger} checked={show.value} /> Show Component
      </label>

      <div class="grid">
        <div>
          <h2>With Transition Class</h2>
          <CSSMotion
            visible={show.value}
            motionName="no-trigger"
            motionDeadline={1000}
            removeOnLeave
            onAppearStart={onStart}
            onEnterStart={onStart}
            onLeaveStart={onStart}
            onAppearEnd={onEnd}
            onEnterEnd={onEnd}
            onLeaveEnd={onEnd}
          >
            {({ style, class: className, ref }) => <div ref={ref} class={clsx('demo-block', className)} style={style} />}
          </CSSMotion>
        </div>
      </div>
    </div>
  );
});
