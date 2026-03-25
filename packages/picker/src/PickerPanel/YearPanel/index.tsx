import { computed, defineComponent } from 'vue';
import { useFullProps } from 'vue-jsx-vapor';
import type { DateType, DisabledDate, SharedPanelProps } from '../../interface';
import { formatValue, isInRange, isSameYear } from '../../utils/dateUtil';
import { useInfo, usePanelContextProvider } from '../context';
import PanelBody from '../PanelBody';
import PanelHeader from '../PanelHeader';

const YearPanel = defineComponent(
  ({ prefixCls, locale, generateConfig, pickerValue, disabledDate, onPickerValueChange, onModeChange }: SharedPanelProps) => {
    const props = useFullProps() as SharedPanelProps;
    const panelPrefixCls = computed(() => `${prefixCls}-year-panel`);

    // ========================== Base ==========================
    const [info] = useInfo(
      props,
      computed(() => 'year'),
    );
    const getStartYear = (date: DateType) => {
      const startYear = Math.floor(generateConfig.getYear(date) / 10) * 10;
      return generateConfig.setYear(date, startYear);
    };
    const getEndYear = (date: DateType) => {
      const startYear = getStartYear(date);
      return generateConfig.addYear(startYear, 9);
    };

    const startYearDate = computed(() => getStartYear(pickerValue));
    const endYearDate = computed(() => getEndYear(pickerValue));

    const baseDate = computed(() => generateConfig.addYear(startYearDate.value, -1));

    // ========================= Cells ==========================
    const getCellDate = (date: DateType, offset: number) => {
      return generateConfig.addYear(date, offset);
    };

    const getCellText = (date: DateType) => {
      return formatValue(date, {
        locale,
        format: locale.cellYearFormat,
        generateConfig,
      });
    };

    const getCellClassName = (date: DateType) => {
      return {
        [`${prefixCls}-cell-in-view`]:
          isSameYear(generateConfig, date, startYearDate.value) ||
          isSameYear(generateConfig, date, endYearDate.value) ||
          isInRange(generateConfig, startYearDate.value, endYearDate.value, date),
      };
    };
    usePanelContextProvider(info);
    return () => {
      // ======================== Disabled ========================
      const mergedDisabledDate: DisabledDate = disabledDate
        ? (currentDate, disabledInfo) => {
            // Start
            const startMonth = generateConfig.setMonth(currentDate, 0);
            const startDate = generateConfig.setDate(startMonth, 1);

            // End
            const endMonth = generateConfig.addYear(startDate, 1);
            const endDate = generateConfig.addDate(endMonth, -1);
            return disabledDate(startDate, disabledInfo) && disabledDate(endDate, disabledInfo);
          }
        : null;

      // ========================= Header =========================
      const yearNode = (
        <button
          type="button"
          key="decade"
          aria-label={locale.decadeSelect}
          onClick={() => {
            onModeChange('decade');
          }}
          tabindex={-1}
          class={`${prefixCls}-decade-btn`}
        >
          {formatValue(startYearDate.value, {
            locale,
            format: locale.yearFormat,
            generateConfig,
          })}
          -
          {formatValue(endYearDate.value, {
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
            superOffset={(distance) => generateConfig.addYear(pickerValue, distance * 10)}
            onChange={onPickerValueChange}
            // Limitation
            getStart={getStartYear}
            getEnd={getEndYear}
          >
            {yearNode}
          </PanelHeader>

          {/* Body */}
          <PanelBody
            {...props}
            disabledDate={mergedDisabledDate}
            titleFormat={locale.fieldYearFormat}
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
);

export default YearPanel;
