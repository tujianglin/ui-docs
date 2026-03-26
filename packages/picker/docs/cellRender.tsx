import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { computed, defineComponent, h, ref } from 'vue';
import { Picker, RangePicker } from '../src';
import momentGenerateConfig from '../src/generate/dayjs';
import zhCN from '../src/locale/zh_CN';
import './assets/index.less';

const defaultValue = dayjs('2019-11-28 01:02:03');

const defaultStartValue = dayjs('2019-09-03 05:02:03');
const defaultEndValue = dayjs('2019-11-28 01:02:03');

function formatDate(date: Dayjs | null) {
  return date ? date.format('YYYY-MM-DD HH:mm:ss') : 'null';
}

export default defineComponent(() => {
  const value = ref<Dayjs | null>(defaultValue);
  const rangeValue = ref<[Dayjs | null, Dayjs | null] | null>([defaultStartValue, defaultEndValue]);

  const onSelect = (newValue: Dayjs) => {
    console.log('Select:', newValue);
  };

  const onChange = (newValue, formatString) => {
    console.log('Change:', newValue, formatString);
    value.value = newValue;
  };

  const sharedProps = computed(() => ({
    generateConfig: momentGenerateConfig,
    value: value.value,
    onSelect,
    onChange,
    presets: [
      {
        label: 'Hello World!',
        value: dayjs(),
      },
    ],
  }));

  const onRangeChange = (newValue: [Dayjs | null, Dayjs | null] | null, formatStrings?: string[]) => {
    console.log('Change:', newValue, formatStrings);
    rangeValue.value = newValue;
  };

  const rangeSharedProps = computed(() => ({
    generateConfig: momentGenerateConfig,
    value: rangeValue.value,
    onChange: onRangeChange,
  }));

  return () => (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <div style={{ margin: '0 8px' }}>
          <h3>Basic</h3>
          <h4>Value: {value.value ? value.value.format('YYYY-MM-DD HH:mm:ss') : null}</h4>
          <Picker
            {...sharedProps.value}
            locale={zhCN}
            cellRender={(current: Dayjs, info) =>
              h(info.originNode, { ...info.originNode.props }, h('div', { style: { background: 'orange' } }, current.get('date')))
            }
          />
          <Picker
            {...sharedProps.value}
            locale={zhCN}
            cellRender={(current: Dayjs, info) =>
              h(
                info.originNode,
                { class: `${info.originNode.props.class} testWrapper` },
                h('div', { style: { background: 'orange' } }, current.get('date')),
              )
            }
          />
          <Picker
            {...sharedProps.value}
            locale={zhCN}
            picker="week"
            cellRender={(current: any, info) =>
              h(info.originNode, { ...info.originNode.props }, h('div', { style: { background: 'orange' } }, current.get('week')))
            }
          />
          <Picker
            {...sharedProps.value}
            locale={zhCN}
            picker="year"
            cellRender={(current: any, info) =>
              h(info.originNode, { ...info.originNode.props }, h('div', { style: { background: 'orange' } }, current.get('year')))
            }
          />
          <Picker
            {...sharedProps.value}
            locale={zhCN}
            picker="month"
            cellRender={(current: any, info) =>
              h(
                info.originNode,
                { ...info.originNode.props },
                h('div', { style: { background: 'orange' } }, current.get('month')),
              )
            }
          />
          <Picker
            {...sharedProps.value}
            locale={zhCN}
            picker="quarter"
            cellRender={(current: any, info) =>
              h(
                info.originNode,
                { ...info.originNode.props },
                h('div', { style: { background: 'orange' } }, `Q${current.get('quarter')}`),
              )
            }
          />
          <Picker
            {...sharedProps.value}
            locale={zhCN}
            picker="time"
            cellRender={(current: any, info) =>
              h(info.originNode, { ...info.originNode.props }, h('div', { style: { background: 'orange' } }, current))
            }
          />
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>Range</h3>
          <h4>
            RangeValue: {rangeValue.value ? `${formatDate(rangeValue.value[0])} ~ ${formatDate(rangeValue.value[1])}` : null}
          </h4>
          <RangePicker
            {...rangeSharedProps.value}
            locale={zhCN}
            allowClear
            showTime
            style={{ width: '580px' }}
            cellRender={(current, info) => {
              return (
                <div title={info.type} style={{ background: info.type === 'time' ? 'green' : 'yellow' }}>
                  {info.type === 'time' ? current : (current as Dayjs).get('date')}
                </div>
              );
            }}
            presets={[
              {
                label: 'ranges',
                value: [dayjs(), dayjs().add(10, 'day')],
              },
            ]}
            onOk={(dates) => {
              console.log('OK!!!', dates);
            }}
          />
        </div>
      </div>
    </div>
  );
});
