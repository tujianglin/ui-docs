import type { Dayjs } from 'dayjs';
import moment from 'dayjs';
import { computed, defineComponent, ref } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import Picker, { type PickerRef } from '../src';
import momentGenerateConfig from '../src/generate/dayjs';
import enUS from '../src/locale/en_US';
import './assets/index.less';

// const defaultValue = moment('2019-09-03 05:02:03');
const defaultValue = moment('2019-11-28 01:02:03');

export default defineComponent(() => {
  const value = ref(defaultValue);
  const weekRef = useRef<PickerRef>(null);

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
        value: moment(),
      },
      {
        label: 'Now',
        value: () => moment(),
      },
    ],
  }));

  const keyDown = (e, preventDefault) => {
    if (e.keyCode === 13) preventDefault();
  };

  return () => (
    <div>
      <h1>Value: {value.value ? value.value.format('YYYY-MM-DD HH:mm:ss') : null}</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <div style={{ margin: '0 8px' }}>
          <h3>Basic</h3>
          {/* <Picker
            {...sharedProps.value}
            locale={zhCN}
            suffixIcon="SUFFIX"
            rootClassName="bamboo"
            class="little"
            classNames={{
              root: 'light',
              popup: {
                container: 'popup-c',
              },
            }}
            open
            styles={{
              popup: {
                container: {
                  backgroundColor: 'red',
                },
              },
            }}
          /> */}
          <Picker {...sharedProps.value} locale={enUS} />
        </div>
        {/* <div style={{ margin: '0 8px' }}>
          <h3>Uncontrolled</h3>
          <Picker generateConfig={momentGenerateConfig} locale={zhCN} allowClear renderExtraFooter={() => 'extra'} />
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>Datetime</h3>
          <Picker
            {...sharedProps.value}
            locale={zhCN}
            defaultPickerValue={defaultValue.clone().subtract(1, 'month')}
            showTime={{
              showSecond: false,
              defaultOpenValue: moment('11:28:39', 'HH:mm:ss'),
            }}
            disabledTime={(date) => {
              if (date && date.isSame(defaultValue, 'date')) {
                return {
                  disabledHours: () => [1, 3, 5, 7, 9, 11],
                };
              }
              return {};
            }}
          />
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>Uncontrolled Datetime</h3>
          <Picker format="YYYY-MM-DD HH:mm:ss" generateConfig={momentGenerateConfig} locale={enUS} showTime />
        </div> */}
        {/* <div style={{ margin: '0 8px' }}>
          <h3>Week</h3>
          <Picker
            {...sharedProps.value}
            locale={zhCN}
            allowClear
            picker="week"
            renderExtraFooter={() => 'I am footer!!!'}
            ref={weekRef}
          />

          <button
            type="button"
            onClick={() => {
              if (weekRef.value) {
                weekRef.value.focus();
              }
            }}
          >
            Focus
          </button>
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>Week</h3>
          <Picker generateConfig={momentGenerateConfig} locale={enUS} picker="week" />
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>Quarter</h3>
          <Picker generateConfig={momentGenerateConfig} locale={enUS} picker="quarter" />
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>Time</h3>
          <Picker {...sharedProps.value} locale={zhCN} picker="time" />
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>Time 12</h3>
          <Picker {...sharedProps.value} locale={zhCN} picker="time" use12Hours />
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>Year</h3>
          <Picker {...sharedProps.value} locale={zhCN} picker="year" />
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>Keyboard navigation (Tab key) disabled</h3>
          <Picker {...sharedProps.value} locale={enUS} tabindex={-1} />
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>Keyboard event with prevent default behaviors</h3>
          <Picker {...sharedProps.value} locale={enUS} onKeydown={keyDown} />
        </div>
        <div style={{ margin: '0 8px' }}>
          <h3>PreviewValue is false</h3>
          <Picker {...sharedProps.value} locale={enUS} onKeydown={keyDown} previewValue={false} />
        </div> */}
      </div>
    </div>
  );
});
