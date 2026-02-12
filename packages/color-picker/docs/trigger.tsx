import type { Color } from '@vc-com/color-picker';
import ColorPicker, { ColorBlock } from '@vc-com/color-picker';
import Trigger from '@vc-com/trigger';
import { computed, defineComponent, ref } from 'vue';
import './assets/index.less';
import builtinPlacements from './placements';

export default defineComponent(() => {
  const value = ref<Color | string>('#1677ff');
  const prefixCls = 'rc-color-picker';
  const color = computed(() => (typeof value.value === 'string' ? value.value : value.value.toRgbString()));
  return () => (
    <Trigger
      action={['click']}
      prefixCls={prefixCls}
      popupPlacement="bottomLeft"
      builtinPlacements={builtinPlacements}
      popup={<ColorPicker value={value.value} onChange={(e) => (value.value = e)} />}
    >
      <ColorBlock color={color.value} prefixCls={prefixCls} />
    </Trigger>
  );
});
