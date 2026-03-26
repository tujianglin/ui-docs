import dayjs, { type Dayjs } from 'dayjs';
import { computed, defineComponent, ref } from 'vue';
import { PickerPanel } from '../src';
import momentGenerateConfig from '../src/generate/dayjs';
import enUS from '../src/locale/en_US';
import jaJP from '../src/locale/ja_JP';
import zhCN from '../src/locale/zh_CN';
import './assets/index.less';

// const defaultValue = dayjs('2019-09-03 05:02:03');
const defaultValue = dayjs('2019-11-28 01:02:03');

export default defineComponent(() => {
  const value = ref<Dayjs | null>(defaultValue);

  const onSelect = (newValue: Dayjs) => {
    console.log('Select:', newValue);
  };

  const onChange = (newValue: Dayjs | null, formatString?: string) => {
    console.log('Change:', newValue, formatString);
    value.value = newValue;
  };

  const sharedProps = computed(() => ({
    generateConfig: momentGenerateConfig,
    value: value.value,
    onSelect,
    onChange,
  }));

  return () => (
    <div>
      <h1>Value: {value.value ? value.value.format('YYYY-MM-DD HH:mm:ss') : null}</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <div style={{ margin: '0 8px' }}>
          <h3>Basic</h3>
          <PickerPanel {...sharedProps.value} locale={zhCN} />
        </div>

        <div style={{ margin: '0 8px' }}>
          <h3>Uncontrolled</h3>
          <PickerPanel
            generateConfig={momentGenerateConfig}
            locale={zhCN}
            onChange={onChange}
            defaultValue={dayjs('2000-01-01', 'YYYY-MM-DD')}
          />
        </div>

        <div style={{ margin: '0 8px' }}>
          <h3>1 Month earlier</h3>
          <PickerPanel {...sharedProps.value} defaultPickerValue={defaultValue.clone().subtract(1, 'month')} locale={enUS} />
        </div>

        <div style={{ margin: '0 8px' }}>
          <h3>Week Picker CN</h3>
          <PickerPanel {...sharedProps.value} locale={zhCN} picker="week" />
        </div>

        <div style={{ margin: '0 8px' }}>
          <h3>Month Picker</h3>
          <PickerPanel {...sharedProps.value} locale={zhCN} picker="month" />
        </div>

        <div style={{ margin: '0 8px' }}>
          <h3>Quarter Picker</h3>
          <PickerPanel {...sharedProps.value} locale={zhCN} picker="quarter" />
        </div>

        <div style={{ margin: '0 8px' }}>
          <h3>Week Picker US</h3>
          <PickerPanel {...sharedProps.value} locale={enUS} picker="week" />
        </div>

        <div style={{ margin: '0 8px' }}>
          <h3>Time</h3>
          <PickerPanel {...sharedProps.value} locale={jaJP} picker="time" />
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>Uncontrolled</h3>
          <PickerPanel {...sharedProps.value} locale={jaJP} value={undefined} picker="time" />
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>Time AM/PM</h3>
          <PickerPanel
            {...sharedProps.value}
            locale={jaJP}
            picker="time"
            showTime={{
              use12Hours: true,
              showSecond: false,
              format: 'hh:mm A',
            }}
          />
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>Datetime</h3>
          <PickerPanel {...sharedProps.value} locale={zhCN} showTime />
        </div>
      </div>
    </div>
  );
});
