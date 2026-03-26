import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { computed, defineComponent, h, ref } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import { RangePicker, type PickerRef } from '../src';
import momentGenerateConfig from '../src/generate/dayjs';
import zhCN from '../src/locale/zh_CN';
import './assets/index.less';
import './common.less';

const defaultStartValue = dayjs('2019-09-03 05:02:03');
const defaultEndValue = dayjs('2019-11-28 01:02:03');

function formatDate(date: Dayjs | null) {
  return date ? date.format('YYYY-MM-DD HH:mm:ss') : 'null';
}

export default defineComponent(() => {
  const value = ref<[Dayjs | null, Dayjs | null] | null>([defaultStartValue, defaultEndValue]);

  const onChange = (newValue: [Dayjs | null, Dayjs | null] | null, formatStrings?: string[]) => {
    console.log('Change:', newValue, formatStrings);
    value.value = newValue;
  };

  const onCalendarChange = (newValue: [Dayjs | null, Dayjs | null] | null, formatStrings?: string[]) => {
    console.log('Calendar Change:', newValue, formatStrings);
  };

  const sharedProps = computed(() => ({
    generateConfig: momentGenerateConfig,
    value: value.value,
    onChange,
    onCalendarChange,
  }));

  const rangePickerRef = useRef<PickerRef>(null);

  const now = momentGenerateConfig.getNow();
  const disabledDate = (current: Dayjs) => {
    return current.diff(now, 'days') > 1 || current.diff(now, 'days') < -1;
  };

  return () => (
    <div>
      <h2>Value: {value.value ? `${formatDate(value.value[0])} ~ ${formatDate(value.value[1])}` : null}</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <div style={{ margin: '0 8px' }}>
          <h3>Basic</h3>
          <RangePicker
            {...sharedProps.value}
            value={undefined}
            locale={zhCN}
            allowClear={{ clearIcon: h('span', null, 'X') }}
            ref={rangePickerRef}
            defaultValue={[dayjs('1990-09-03'), dayjs('1989-11-28')]}
            suffixIcon={h('span', null, 'O')}
            presets={[
              {
                label: 'Last week',
                value: [dayjs().subtract(1, 'week'), dayjs()],
              },
              {
                label: 'Last 3 days',
                value: () => [dayjs().subtract(3, 'days'), dayjs().add(3, 'days')],
              },
            ]}
          />
          <RangePicker
            {...sharedProps.value}
            locale={zhCN}
            allowClear
            ref={rangePickerRef}
            showTime
            style={{ width: 580 }}
            cellRender={(current: Dayjs, info) => (
              <div title={info.type} style={{ background: 'green' }}>
                {typeof current === 'number' ? current : current.get('date')}
              </div>
            )}
            onOk={(dates) => {
              console.log('OK!!!', dates);
            }}
            needConfirm
          />
          <RangePicker {...sharedProps.value} value={undefined} locale={zhCN} allowClear picker="time" />
          <RangePicker {...sharedProps.value} value={undefined} locale={zhCN} allowClear picker="time" style={{ width: 280 }} />
        </div>

        <div style={{ margin: '0 8px' }}>
          <h3>Focus</h3>
          <RangePicker
            {...sharedProps.value}
            locale={zhCN}
            allowClear
            ref={rangePickerRef}
            // style={{ width: 500 }}
          />
          <button
            type="button"
            onClick={() => {
              rangePickerRef.value!.focus();
            }}
          >
            Focus!
          </button>
        </div>

        <div style={{ margin: '0 8px' }}>
          <h3>Year</h3>
          <RangePicker {...sharedProps.value} locale={zhCN} picker="year" />
        </div>

        <div style={{ margin: '0 8px' }}>
          <h3>Quarter</h3>
          <RangePicker {...sharedProps.value} locale={zhCN} picker="quarter" />
        </div>

        <div style={{ margin: '0 8px' }}>
          <h3>Month</h3>
          <RangePicker {...sharedProps.value} locale={zhCN} picker="month" />
        </div>

        <div style={{ margin: '0 8px' }}>
          <h3>Week</h3>
          <RangePicker {...sharedProps.value} locale={zhCN} picker="week" />
        </div>

        <div style={{ margin: '0 8px' }}>
          <h3>Allow Empty</h3>
          <RangePicker {...sharedProps.value} locale={zhCN} allowClear allowEmpty={[true, true]} />
        </div>

        <div style={{ margin: '0 8px' }}>
          <h3>Start disabled</h3>
          <RangePicker {...sharedProps.value} locale={zhCN} allowClear disabled={[true, false]} />
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>End disabled</h3>
          <RangePicker {...sharedProps.value} locale={zhCN} allowClear disabled={[false, true]} />
        </div>

        <div style={{ margin: '0 8px' }}>
          <h3>Uncontrolled</h3>
          <RangePicker
            {...sharedProps.value}
            value={undefined}
            locale={zhCN}
            placeholder={['start...', 'end...']}
            disabled={[false, true]}
            allowEmpty={[false, true]}
            renderExtraFooter={() => <div>extra footer</div>}
          />
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>Uncontrolled2</h3>
          <RangePicker {...sharedProps.value} value={undefined} locale={zhCN} placeholder={['start...', 'end...']} />
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>DisabledDate</h3>
          <RangePicker
            {...sharedProps.value}
            value={undefined}
            locale={zhCN}
            placeholder={['start...', 'end...']}
            disabledDate={disabledDate}
          />
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>PreviewValue is false</h3>
          <RangePicker
            {...sharedProps.value}
            previewValue={false}
            value={undefined}
            locale={zhCN}
            placeholder={['start...', 'end...']}
            disabledDate={disabledDate}
          />
        </div>
      </div>
    </div>
  );
});
