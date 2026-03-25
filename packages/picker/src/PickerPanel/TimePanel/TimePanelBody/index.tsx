import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent } from 'vue';
import { useFullProps } from 'vue-jsx-vapor';
import useTimeInfo from '../../../hooks/useTimeInfo';
import type { DateType, SharedPanelProps, SharedTimeProps } from '../../../interface';
import { formatValue } from '../../../utils/dateUtil';
import { usePanelContextInject, usePickerHackContextInject } from '../../context';
import TimeColumn, { type Unit } from './TimeColumn';

function isAM(hour) {
  return hour < 12;
}

export type TimePanelBodyProps = SharedPanelProps;

const TimePanelBody = defineComponent(
  ({
    // Show Config
    showHour,
    showMinute,
    showSecond,
    showMillisecond,
    use12Hours: showMeridiem,

    // MISC
    changeOnScroll,
  }: SharedTimeProps) => {
    const props = useFullProps() as SharedTimeProps;
    const {
      prefixCls,
      classNames,
      styles,
      values,
      generateConfig,
      locale,
      onSelect,
      onHover = () => {},
      pickerValue,
    } = $(usePanelContextInject());

    const value = computed(() => values?.[0] || null);

    const { onCellDblClick } = $(usePickerHackContextInject());

    // ========================== Info ==========================
    const [getValidTime, rowHourUnits, getMinuteUnits, getSecondUnits, getMillisecondUnits] = useTimeInfo(
      computed(() => generateConfig),
      reactiveComputed(() => props),
      value,
    );

    // ========================= Value ==========================
    // PickerValue will tell which one to align on the top
    const getUnitValue = (
      func: 'getHour' | 'getMinute' | 'getSecond' | 'getMillisecond',
    ): { valueNum: number; pickerNum: number } => {
      const valueUnitVal = value.value && generateConfig[func](value.value);
      const pickerUnitValue = pickerValue && generateConfig[func](pickerValue);

      return { valueNum: valueUnitVal, pickerNum: pickerUnitValue };
    };

    const { valueNum: hour, pickerNum: pickerHour } = $(reactiveComputed(() => getUnitValue('getHour')));
    const { valueNum: minute, pickerNum: pickerMinute } = $(reactiveComputed(() => getUnitValue('getMinute')));
    const { valueNum: second, pickerNum: pickerSecond } = $(reactiveComputed(() => getUnitValue('getSecond')));
    const { valueNum: millisecond, pickerNum: pickerMillisecond } = $(reactiveComputed(() => getUnitValue('getMillisecond')));
    const meridiem = computed(() => (hour === null ? null : isAM(hour) ? 'am' : 'pm'));

    // ========================= Column =========================
    // Hours
    const hourUnits = computed(() => {
      if (!showMeridiem) {
        return rowHourUnits;
      }

      return isAM(hour)
        ? rowHourUnits.filter((h) => isAM(h.value as number))
        : rowHourUnits.filter((h) => !isAM(h.value as number));
    });

    // >>> Pick Fallback
    const getEnabled = (units: Unit<number>[], val: number) => {
      const enabledUnits = units.filter((unit) => !unit.disabled);

      return (
        val ??
        // Fallback to enabled value
        enabledUnits?.[0]?.value
      );
    };

    // >>> Minutes
    const validHour = computed(() => getEnabled(rowHourUnits, hour));
    const minuteUnits = computed(() => getMinuteUnits(validHour.value));

    // >>> Seconds
    const validMinute = computed(() => getEnabled(minuteUnits.value, minute));
    const secondUnits = computed(() => getSecondUnits(validHour.value, validMinute.value));

    // >>> Milliseconds
    const validSecond = computed(() => getEnabled(secondUnits.value, second));
    const millisecondUnits = computed(() => getMillisecondUnits(validHour.value, validMinute.value, validSecond.value));

    const validMillisecond = computed(() => getEnabled(millisecondUnits.value, millisecond));

    // Meridiem
    const meridiemUnits = computed(() => {
      if (!showMeridiem) {
        return [];
      }

      const base = generateConfig.getNow();
      const amDate = generateConfig.setHour(base, 6);
      const pmDate = generateConfig.setHour(base, 18);

      const formatMeridiem = (date: DateType, defaultLabel: string) => {
        const { cellMeridiemFormat } = locale;
        return cellMeridiemFormat
          ? formatValue(date, {
              generateConfig,
              locale,
              format: cellMeridiemFormat,
            })
          : defaultLabel;
      };

      return [
        {
          label: formatMeridiem(amDate, 'AM'),
          value: 'am',
          disabled: rowHourUnits.every((h) => h.disabled || !isAM(h.value as number)),
        },
        {
          label: formatMeridiem(pmDate, 'PM'),
          value: 'pm',
          disabled: rowHourUnits.every((h) => h.disabled || isAM(h.value as number)),
        },
      ];
    });

    // ========================= Change =========================
    /**
     * Check if time is validate or will match to validate one
     */
    const triggerChange = (nextDate: DateType) => {
      const validateDate = getValidTime(nextDate);

      onSelect(validateDate);
    };

    // ========================= Column =========================
    // Create a template date for the trigger change event
    const triggerDateTmpl = computed(() => {
      let tmpl = value.value || pickerValue || generateConfig.getNow();

      const isNotNull = (num: number) => num !== null && num !== undefined;

      if (isNotNull(hour)) {
        tmpl = generateConfig.setHour(tmpl, hour);
        tmpl = generateConfig.setMinute(tmpl, minute);
        tmpl = generateConfig.setSecond(tmpl, second);
        tmpl = generateConfig.setMillisecond(tmpl, millisecond);
      } else if (isNotNull(pickerHour)) {
        tmpl = generateConfig.setHour(tmpl, pickerHour);
        tmpl = generateConfig.setMinute(tmpl, pickerMinute);
        tmpl = generateConfig.setSecond(tmpl, pickerSecond);
        tmpl = generateConfig.setMillisecond(tmpl, pickerMillisecond);
      } else if (isNotNull(validHour.value)) {
        tmpl = generateConfig.setHour(tmpl, validHour.value);
        tmpl = generateConfig.setMinute(tmpl, validMinute.value);
        tmpl = generateConfig.setSecond(tmpl, validSecond.value);
        tmpl = generateConfig.setMillisecond(tmpl, validMillisecond.value);
      }

      return tmpl;
    });

    // ===================== Columns Change =====================
    const fillColumnValue = (val: number | string, func: 'setHour' | 'setMinute' | 'setSecond' | 'setMillisecond') => {
      if (val === null) {
        return null;
      }
      return generateConfig[func](triggerDateTmpl.value, val as any);
    };

    const getNextHourTime = (val: number) => fillColumnValue(val, 'setHour');
    const getNextMinuteTime = (val: number) => fillColumnValue(val, 'setMinute');
    const getNextSecondTime = (val: number) => fillColumnValue(val, 'setSecond');
    const getNextMillisecondTime = (val: number) => fillColumnValue(val, 'setMillisecond');
    const getMeridiemTime = (val: string) => {
      if (val === null) {
        return null;
      }

      if (val === 'am' && !isAM(hour)) {
        return generateConfig.setHour(triggerDateTmpl.value, hour - 12);
      } else if (val === 'pm' && isAM(hour)) {
        return generateConfig.setHour(triggerDateTmpl.value, hour + 12);
      }
      return triggerDateTmpl.value;
    };

    const onHourChange = (val) => {
      triggerChange(getNextHourTime(val));
    };

    const onMinuteChange = (val) => {
      triggerChange(getNextMinuteTime(val));
    };

    const onSecondChange = (val) => {
      triggerChange(getNextSecondTime(val));
    };

    const onMillisecondChange = (val) => {
      triggerChange(getNextMillisecondTime(val));
    };

    const onMeridiemChange = (val) => {
      triggerChange(getMeridiemTime(val));
    };

    // ====================== Column Hover ======================
    const onHourHover = (val) => {
      onHover(getNextHourTime(val));
    };

    const onMinuteHover = (val) => {
      onHover(getNextMinuteTime(val));
    };

    const onSecondHover = (val) => {
      onHover(getNextSecondTime(val));
    };

    const onMillisecondHover = (val) => {
      onHover(getNextMillisecondTime(val));
    };

    const onMeridiemHover = (val) => {
      onHover(getMeridiemTime(val));
    };

    // ========================= Render =========================
    const sharedColumnProps = {
      onDblClick: onCellDblClick,
      changeOnScroll,
    };

    return () => (
      <div class={clsx(`${prefixCls}-content`, classNames.content)} style={styles.content}>
        <TimeColumn
          v-if={showHour}
          units={hourUnits.value}
          value={hour}
          optionalValue={pickerHour}
          type="hour"
          onChange={onHourChange}
          onHover={onHourHover}
          {...sharedColumnProps}
        />
        <TimeColumn
          v-if={showMinute}
          units={minuteUnits.value}
          value={minute}
          optionalValue={pickerMinute}
          type="minute"
          onChange={onMinuteChange}
          onHover={onMinuteHover}
          {...sharedColumnProps}
        />
        <TimeColumn
          v-if={showSecond}
          units={secondUnits.value}
          value={second}
          optionalValue={pickerSecond}
          type="second"
          onChange={onSecondChange}
          onHover={onSecondHover}
          {...sharedColumnProps}
        />
        <TimeColumn
          v-if={showMillisecond}
          units={millisecondUnits.value}
          value={millisecond}
          optionalValue={pickerMillisecond}
          type="millisecond"
          onChange={onMillisecondChange}
          onHover={onMillisecondHover}
          {...sharedColumnProps}
        />
        <TimeColumn
          v-if={showMeridiem}
          units={meridiemUnits.value}
          value={meridiem.value}
          type="meridiem"
          onChange={onMeridiemChange}
          onHover={onMeridiemHover}
          {...sharedColumnProps}
        />
      </div>
    );
  },
  { inheritAttrs: false },
);

export default TimePanelBody;
