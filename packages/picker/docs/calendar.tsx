import { defineComponent } from 'vue';
import { Picker, PickerPanel } from '../src';
import momentGenerateConfig from '../src/generate/dayjs';
import zhCN from '../src/locale/zh_CN';
import './assets/index.less';
import './calendar.less';

function dateRender(date, { today }) {
  return (
    <div
      style={{
        width: '80px',
        height: '80px',
        borderTop: '3px solid #CCC',
        borderTopColor: date.isSame(today, 'date') ? 'blue' : '#CCC',
      }}
    >
      {date.date()}
    </div>
  );
}

const disabledProps = {
  disabledDate: (date) => date.date() === 10,
  onSelect: (d) => console.log('Select:', d.format('YYYY-MM-DD')),
  onChange: (d) => console.log('Change:', d.format('YYYY-MM-DD')),
};

export default defineComponent(() => {
  return () => (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      <div>
        <PickerPanel
          locale={zhCN}
          // picker="month"
          generateConfig={momentGenerateConfig}
          cellRender={dateRender}
          {...disabledProps}
        />
      </div>
      <div>
        <Picker locale={zhCN} generateConfig={momentGenerateConfig} cellRender={dateRender} {...disabledProps} />
      </div>
    </div>
  );
});
