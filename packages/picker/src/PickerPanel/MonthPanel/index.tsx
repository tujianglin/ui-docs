import { computed, defineComponent } from 'vue';
import { useFullProps } from 'vue-jsx-vapor';
import type { DateType, DisabledDate, SharedPanelProps } from '../../interface';
import { formatValue } from '../../utils/dateUtil';
import { useInfo, usePanelContextProvider } from '../context';
import PanelBody from '../PanelBody';
import PanelHeader from '../PanelHeader';

const MonthPanel = defineComponent(
  ({ prefixCls, locale, generateConfig, pickerValue, disabledDate, onPickerValueChange, onModeChange }: SharedPanelProps) => {
    const props = useFullProps() as SharedPanelProps;
    const panelPrefixCls = computed(() => `${prefixCls}-month-panel`);

    // ========================== Base ==========================
    const [info] = useInfo(
      props,
      computed(() => 'month'),
    );
    const baseDate = computed(() => generateConfig.setMonth(pickerValue, 0));

    // ========================= Month ==========================
    const monthsLocale = computed<string[]>(
      () =>
        locale.shortMonths || (generateConfig.locale.getShortMonths ? generateConfig.locale.getShortMonths(locale.locale) : []),
    );

    // ========================= Cells ==========================
    const getCellDate = (date: DateType, offset: number) => {
      return generateConfig.addMonth(date, offset);
    };

    const getCellText = (date: DateType) => {
      const month = generateConfig.getMonth(date);

      return locale.monthFormat
        ? formatValue(date, {
            locale,
            format: locale.monthFormat,
            generateConfig,
          })
        : monthsLocale[month];
    };

    const getCellClassName = () => ({
      [`${prefixCls}-cell-in-view`]: true,
    });

    usePanelContextProvider(info);
    return () => {
      // ======================== Disabled ========================
      const mergedDisabledDate: DisabledDate = disabledDate
        ? (currentDate, disabledInfo) => {
            const startDate = generateConfig.setDate(currentDate, 1);
            const nextMonthStartDate = generateConfig.setMonth(startDate, generateConfig.getMonth(startDate) + 1);
            const endDate = generateConfig.addDate(nextMonthStartDate, -1);

            return disabledDate(startDate, disabledInfo) && disabledDate(endDate, disabledInfo);
          }
        : null;

      // ========================= Header =========================
      const yearNode = (
        <button
          type="button"
          key="year"
          aria-label={locale.yearSelect}
          onClick={() => {
            onModeChange('year');
          }}
          tabindex={-1}
          class={`${prefixCls}-year-btn`}
        >
          {formatValue(pickerValue, {
            locale,
            format: locale.yearFormat,
            generateConfig,
          })}
        </button>
      );

      // ========================= Render =========================
      return (
        <div class={panelPrefixCls.value}>
          {/* Header */}
          <PanelHeader
            superOffset={(distance) => generateConfig.addYear(pickerValue, distance)}
            onChange={onPickerValueChange}
            // Limitation
            getStart={(date) => generateConfig.setMonth(date, 0)}
            getEnd={(date) => generateConfig.setMonth(date, 11)}
          >
            {yearNode}
          </PanelHeader>

          {/* Body */}
          <PanelBody
            {...props}
            disabledDate={mergedDisabledDate}
            titleFormat={locale.fieldMonthFormat}
            colNum={3}
            rowNum={4}
            baseDate={baseDate.value}
            // Body
            getCellDate={getCellDate}
            getCellText={getCellText}
            getCellClassName={getCellClassName}
          />
        </div>
      );
    };
  },
  { inheritAttrs: false },
);

export default MonthPanel;
