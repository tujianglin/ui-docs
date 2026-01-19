import CSSMotion from '@vc-com/motion';
import { genCSSMotion } from '@vc-com/motion/CSSMotion';
import clsx from 'clsx';
import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import './basic.less';

const ServerCSSMotion = genCSSMotion(false);

const onCollapse = () => ({ height: '0px' });

interface MotionAppearProps {
  supportMotion: boolean;
}

const MotionAppear = defineComponent(({ supportMotion }: MotionAppearProps) => {
  return () => {
    const Component = supportMotion ? CSSMotion : ServerCSSMotion;
    console.log(Component);
    return (
      <Component motionName="transition" leavedClassName="hidden" motionAppear onAppearStart={onCollapse}>
        {({ style, class: className, ref }) => <div ref={ref} class={clsx('demo-block', className)} style={style} />}
      </Component>
    );
  };
});

export default defineComponent(() => {
  const ssrValue = ref('Waiting for SSR rendering...');
  const containerRef = ref<HTMLElement | null>(null);

  onMounted(() => {
    const mockSSR = `
    <div class="demo-block hidden" style="display: none;"></div>
  `.trim();

    ssrValue.value = mockSSR;

    const div = document.createElement('div');
    div.innerHTML = mockSSR;
    document.body.appendChild(div);
    containerRef.value = div;
  });

  onBeforeUnmount(() => {
    if (containerRef.value) {
      document.body.removeChild(containerRef.value);
    }
  });
  return () => (
    <div>
      <textarea value={ssrValue.value} style={{ width: '100%' }} rows={5} readonly />
      <MotionAppear supportMotion></MotionAppear>
    </div>
  );
});
