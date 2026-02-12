import ColorPicker, { Color } from '@vc-com/color-picker';
import { defineComponent, ref } from 'vue';
import './assets/index.less';

let start = true;

export default defineComponent(() => {
  const value = ref(new Color('rgba(255,0,0,0)'));

  return () => (
    <>
      <ColorPicker
        value={value.value}
        onChange={(nextValue) => {
          let proxyValue = nextValue;

          if (start) {
            start = false;
            proxyValue = nextValue.setA(1);
          }
          value.value = proxyValue;
        }}
      />
      <br />
      <div
        style={{
          width: '258px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <span>hex: {value.value.toHexString()}</span>
        <span> rgb: {value.value.toRgbString()}</span>
        <span> hsb: {value.value.toHsbString()}</span>
      </div>
    </>
  );
});
