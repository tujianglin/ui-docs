import { defineComponent, ref } from 'vue';
import { QRCodeCanvas } from '../src';

export default defineComponent(() => {
  const value = ref('https://ant-design.antgroup.com/');
  return () => (
    <div>
      <input v-model={value.value} type="text" placeholder="The value of qrcode" style={{ width: '100%' }} />
      <hr />
      <QRCodeCanvas
        value={value.value}
        size={200}
        title="Ant Design"
        fgColor="green"
        bgColor="#fff"
        style={{ border: '5px solid #000', borderRadius: '10px', padding: '10px' }}
      />
    </div>
  );
});
