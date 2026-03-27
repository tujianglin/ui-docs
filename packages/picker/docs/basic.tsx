import type { Dayjs } from 'dayjs';
import moment from 'dayjs';
import { computed, defineComponent, ref } from 'vue';
import Picker from '../src';
import momentGenerateConfig from '../src/generate/dayjs';
import enUS from '../src/locale/en_US';
import './assets/index.less';

// const defaultValue = moment('2019-09-03 05:02:03');
const defaultValue = moment('2019-11-28 01:02:03');

export default defineComponent(() => {
  const value = ref(defaultValue);

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

  return () => (
    <div>
      <h1>Value: {value.value ? value.value.format('YYYY-MM-DD HH:mm:ss') : null}</h1>

      <Picker {...sharedProps.value} locale={enUS} />
    </div>
  );
});
