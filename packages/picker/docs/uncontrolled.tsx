import { RangePicker } from '../src';
import momentGenerateConfig from '../src/generate/dayjs';
import zhCN from '../src/locale/zh_CN';
import './assets/index.less';

export default () => (
  <div>
    <div style={{ margin: '0 8px' }}>
      <h3>Uncontrolled</h3>
      {/* <Picker
        generateConfig={momentGenerateConfig}
        locale={zhCN}
        picker="week"
        allowClear
        onOpenChange={(open) => {
          console.log('1 =>', open);
        }}
      />
      <Picker
        generateConfig={momentGenerateConfig}
        locale={zhCN}
        picker="week"
        allowClear
        open
        onOpenChange={(open) => {
          console.log('2 =>', open);
        }}
      /> */}
      <RangePicker
        generateConfig={momentGenerateConfig}
        locale={zhCN}
        picker="week"
        allowClear
        // open
        onOpenChange={(open) => {
          console.log('3 =>', open);
        }}
      />
      <button type="button">233</button>
    </div>
  </div>
);
