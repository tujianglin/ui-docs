import { reactiveComputed } from '@vueuse/core';
import { omit } from 'es-toolkit';
import { computed, defineComponent } from 'vue';
import { useFullProps } from 'vue-jsx-vapor';
import useTimeInfo from '../../hooks/useTimeInfo';
import type { DateType, SharedPanelProps } from '../../interface';
import { fillTime } from '../../utils/dateUtil';
import DatePanel from '../DatePanel';
import TimePanel from '../TimePanel';

const DateTimePanel = defineComponent(
  ({ prefixCls, generateConfig, showTime, onSelect, value, pickerValue, onHover }: SharedPanelProps) => {
    const props = useFullProps() as SharedPanelProps;
    const panelPrefixCls = computed(() => `${prefixCls}-datetime-panel`);

    // =============================== Time ===============================
    const [getValidTime] = useTimeInfo(
      computed(() => generateConfig),
      reactiveComputed(() => showTime),
    );

    // Merge the time info from `value` or `pickerValue`
    const mergeTime = (date: DateType) => {
      if (value) {
        return fillTime(generateConfig, date, value);
      }

      return fillTime(generateConfig, date, pickerValue);
    };

    // ============================== Hover ===============================
    const onDateHover = (date: DateType) => {
      onHover?.(date ? mergeTime(date) : date);
    };

    // ============================== Select ==============================
    const onDateSelect = (date: DateType) => {
      // Merge with current time
      const cloneDate = mergeTime(date);

      onSelect(getValidTime(cloneDate, cloneDate));
    };

    // ============================== Render ==============================
    return () => (
      <div class={panelPrefixCls.value}>
        <DatePanel {...omit(props, ['onHover', 'onSelect'])} onSelect={onDateSelect} onHover={onDateHover} />
        <TimePanel {...omit(props, ['values'])} values={props.values} />
      </div>
    );
  },
  { inheritAttrs: false },
);

export default DateTimePanel;
