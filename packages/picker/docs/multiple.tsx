import type { PickerRef } from '../src/interface';
import SinglePicker from '../src/PickerInput/SinglePicker';
import './assets/index.less';

import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { defineComponent } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import dayjsGenerateConfig from '../src/generate/dayjs';
import zhCN from '../src/locale/zh_CN';

dayjs.locale('zh-cn');
dayjs.extend(LocalizedFormat);

console.clear();

const sharedLocale = {
  locale: zhCN,
  generateConfig: dayjsGenerateConfig,
  style: { width: '300px' },
};

export default defineComponent(() => {
  const singleRef = useRef<PickerRef>(null);

  return () => (
    <div>
      <SinglePicker {...sharedLocale} multiple ref={singleRef} onOpenChange={console.error} />
      <SinglePicker {...sharedLocale} multiple ref={singleRef} needConfirm />
      <SinglePicker {...sharedLocale} multiple picker="week" defaultValue={[dayjs('2021-01-01'), dayjs('2021-01-08')]} />
    </div>
  );
});
