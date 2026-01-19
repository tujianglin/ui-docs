import CSSMotion from '@vc-com/motion';
import clsx from 'clsx';
import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import './basic.less';

async function forceDelay(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });
}

const Div = defineComponent((props) => {
  const slots = defineSlots();
  onMounted(() => {
    console.log('DIV >>> Mounted!');
  });

  onBeforeUnmount(() => {
    console.log('DIV >>> UnMounted!');
  });

  return () => <div {...props}>{slots.default?.()}</div>;
});

const App = defineComponent(() => {
  const show = ref(true);
  const forceRender = ref(false);
  const removeOnLeave = ref(true);
  const hasMotionClassName = ref(true);
  const prepare = ref(false);
  const motionLeaveImmediately = ref(false);

  const onTrigger = () => {
    setTimeout(() => {
      show.value = !show.value;
    }, 100);
  };

  const onTriggerDelay = () => {
    prepare.value = !prepare.value;
  };

  const onForceRender = () => {
    forceRender.value = !forceRender.value;
  };

  const onRemoveOnLeave = () => {
    removeOnLeave.value = !removeOnLeave.value;
  };

  const onTriggerClassName = () => {
    hasMotionClassName.value = !hasMotionClassName.value;
  };

  const onCollapse = () => {
    return { height: '0px' };
  };

  const onMotionLeaveImmediately = () => {
    motionLeaveImmediately.value = !motionLeaveImmediately.value;
  };

  const skipColorTransition = (_: any, event: any) => {
    if (event.propertyName === 'background-color') {
      return false;
    }
    return true;
  };

  const styleGreen = () => ({
    background: 'green',
  });
  return () => (
    <div>
      <label>
        <input type="checkbox" onChange={onTrigger} checked={show.value} /> Show Component
      </label>

      <label>
        <input type="checkbox" onChange={onTriggerClassName} checked={hasMotionClassName.value} /> hasMotionClassName
      </label>

      <label>
        <input type="checkbox" onChange={onForceRender} checked={forceRender.value} /> forceRender
      </label>

      <label>
        <input type="checkbox" onChange={onRemoveOnLeave} checked={removeOnLeave.value} /> removeOnLeave
        {removeOnLeave.value ? '' : ' (use leavedClassName)'}
      </label>

      <label>
        <input type="checkbox" onChange={onTriggerDelay} checked={prepare.value} /> prepare before motion
      </label>

      <div class="grid">
        <div>
          <h2>With Transition Class</h2>
          <CSSMotion
            visible={show.value}
            forceRender={forceRender.value}
            motionName={hasMotionClassName.value ? 'transition' : null}
            removeOnLeave={removeOnLeave.value}
            leavedClassName="hidden"
            motionAppear={false}
            onAppearPrepare={() => prepare.value && forceDelay()}
            onEnterPrepare={() => prepare.value && forceDelay()}
            onAppearStart={onCollapse}
            onEnterStart={onCollapse}
            onLeaveActive={onCollapse}
            onEnterEnd={skipColorTransition}
            onLeaveEnd={skipColorTransition}
            onVisibleChanged={(visible) => {
              console.log('Visible Changed:', visible);
            }}
          >
            {({ style, class: className, ref }) => <Div ref={ref} class={clsx('demo-block', className)} style={style} />}
          </CSSMotion>
        </div>

        <div>
          <h2>With Animation Class</h2>
          <CSSMotion
            visible={show.value}
            forceRender={forceRender.value}
            motionName={hasMotionClassName.value ? 'animation' : null}
            removeOnLeave={removeOnLeave.value}
            leavedClassName="hidden"
            onLeaveActive={styleGreen}
          >
            {({ style, class: className }) => <div class={clsx('demo-block', className)} style={style} />}
          </CSSMotion>
        </div>
      </div>

      <div>
        <button type="button" onClick={onMotionLeaveImmediately}>
          motionLeaveImmediately
        </button>

        <div>
          {motionLeaveImmediately.value && (
            <CSSMotion
              visible={false}
              motionName={hasMotionClassName.value ? 'transition' : null}
              removeOnLeave={removeOnLeave.value}
              leavedClassName="hidden"
              onLeaveActive={onCollapse}
              motionLeaveImmediately
              onLeaveEnd={skipColorTransition}
            >
              {({ style, class: className }) => <div class={clsx('demo-block', className)} style={style} />}
            </CSSMotion>
          )}
        </div>
      </div>
    </div>
  );
});

export default App;
