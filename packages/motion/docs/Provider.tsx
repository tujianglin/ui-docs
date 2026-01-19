import CSSMotion, { MotionProvider } from '@vc-com/motion';
import clsx from 'clsx';
import { defineComponent, ref } from 'vue';

export default defineComponent(() => {
  const show = ref(true);
  const motion = ref(false);

  const onPrepare = (node: HTMLElement) => {
    console.log('🔥 prepare', node);

    return new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  };

  return () => (
    <MotionProvider value={{ motion: motion.value }}>
      <button onClick={() => (show.value = !show.value)}>show: {String(show.value)}</button>
      <button onClick={() => (motion.value = !motion.value)}>motion: {String(motion.value)}</button>

      <CSSMotion
        visible={show.value}
        motionName={'transition'}
        leavedClassName="hidden"
        motionAppear
        onAppearPrepare={onPrepare}
        onEnterPrepare={onPrepare}
        onLeavePrepare={onPrepare}
        onVisibleChanged={(visible) => {
          console.log('Visible Changed:', visible);
        }}
      >
        {({ style, class: className, ref }) => (
          <>
            <div ref={ref} class={clsx('demo-block', className)} style={style} />
            <ul>
              <li>ClassName: {JSON.stringify(className)}</li>
              <li>Style: {JSON.stringify(style)}</li>
            </ul>
          </>
        )}
      </CSSMotion>
    </MotionProvider>
  );
});
