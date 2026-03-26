import { defineComponent, ref } from 'vue';
import type { ErrorCorrectionLevel } from '../src';
import { QRCodeCanvas } from '../src';

export default defineComponent(() => {
  const value = ref('https://ant-design.antgroup.com/');
  const level = ref('L');
  return () => (
    <div>
      <span onChange={(e) => (level.value = (e.target as HTMLInputElement).value)}>
        <input type="radio" name="level" value="L" id="L" checked />
        <label html-for="L">L</label>
        <input type="radio" name="level" value="M" id="M" />
        <label html-for="M">M</label>
        <input type="radio" name="level" value="Q" id="Q" />
        <label html-for="Q">Q</label>
        <input type="radio" name="level" value="H" id="H" />
        <label html-for="H">H</label>
      </span>
      &nbsp;&nbsp;&nbsp;&nbsp;
      <input v-model={value.value} type="text" placeholder="The value of qrcode" style={{ width: '80%' }} />
      <hr />
      <QRCodeCanvas value={value.value} size={200} title="Ant Design" level={level.value as ErrorCorrectionLevel} />
    </div>
  );
});
