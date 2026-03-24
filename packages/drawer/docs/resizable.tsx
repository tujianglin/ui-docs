import Drawer, { type Placement } from '@vc-com/drawer';

import { computed, defineComponent, ref } from 'vue';
import './assets/index.less';
import motionProps from './motion';

export default defineComponent(() => {
  const open = ref(false);
  const placement = ref<Placement>('left');
  const width = ref(320);
  const height = ref(240);

  const buttons = [
    { placement: 'left' as Placement, label: 'Left Drawer' },
    { placement: 'right' as Placement, label: 'Right Drawer' },
    { placement: 'top' as Placement, label: 'Top Drawer' },
    { placement: 'bottom' as Placement, label: 'Bottom Drawer' },
  ];

  const openDrawer = (direction: Placement) => {
    placement.value = direction;
    open.value = true;
  };

  const isHorizontal = computed(() => placement.value === 'left' || placement.value === 'right');

  return () => (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        {buttons.map(({ placement, label }) => (
          <button key={placement} onClick={() => openDrawer(placement)} style={{ padding: '8px 16px' }}>
            {label}
          </button>
        ))}
      </div>
      <Drawer
        size={width.value}
        placement={placement.value as Placement}
        open={open.value}
        key={placement.value}
        onClose={() => (open.value = false)}
        resizable={{
          onResize: (size) => {
            if (isHorizontal.value) {
              width.value = size;
            } else {
              height.value = size;
            }
          },
          onResizeStart: () => {
            console.log('onResizeStart');
          },
          onResizeEnd: () => {
            console.log('onResizeEnd');
          },
        }}
        {...motionProps}
      >
        <div>Resizable Drawer</div>
      </Drawer>
    </div>
  );
});
