import { clsx } from 'clsx';
import { computed, defineComponent } from 'vue';
import { useFullProps } from 'vue-jsx-vapor';
import type { DateType, PanelMode, SharedPanelProps } from '../../interface';
import { formatValue, getWeekStartDate, isSameDate, isSameMonth, WEEK_DAY_COUNT } from '../../utils/dateUtil';
import { useInfo, usePanelContextProvider } from '../context';
import PanelBody from '../PanelBody';
import PanelHeader from '../PanelHeader';

export interface DatePanelProps extends SharedPanelProps {
  panelName?: PanelMode;
  rowClassName?: (date: DateType) => string;

  /** Used for `WeekPanel` */
  mode?: PanelMode;
  cellSelection?: boolean;
}

const DatePanel = defineComponent(
  ({
    prefixCls,
    panelName = 'date',
    locale,
    generateConfig,
    pickerValue,
    onPickerValueChange,
    onModeChange,
    mode = 'date',
    disabledDate,
    onSelect,
    onHover,
    showWeek,
  }: DatePanelProps) => {
    const props = useFullProps() as unknown as DatePanelProps;
    const panelPrefixCls = computed(() => `${prefixCls}-${panelName}-panel`);

    const cellPrefixCls = computed(() => `${prefixCls}-cell`);

    const isWeek = computed(() => mode === 'week');

    // ========================== Base ==========================
    // @ts-ignore
    const [info, now] = useInfo(
      props,
      computed(() => mode),
    );
    const weekFirstDay = computed(() => generateConfig.locale.getWeekFirstDay(locale.locale));
    const monthStartDate = computed(() => generateConfig.setDate(pickerValue, 1));
    const baseDate = computed(() => getWeekStartDate(locale.locale, generateConfig, monthStartDate.value));
    const month = computed(() => generateConfig.getMonth(pickerValue));

    // =========================== PrefixColumn ===========================
    const showPrefixColumn = computed(() => (showWeek === undefined ? isWeek.value : showWeek));
    usePanelContextProvider(info);
    return () => {
      const prefixColumn = showPrefixColumn.value
        ? (date: DateType) => {
            // >>> Additional check for disabled
            const disabled = disabledDate?.(date, { type: 'week' });

            return (
              <td
                key="week"
                class={clsx(cellPrefixCls.value, `${cellPrefixCls.value}-week`, {
                  [`${cellPrefixCls.value}-disabled`]: disabled,
                })}
                // Operation: Same as code in PanelBody
                onClick={() => {
                  if (!disabled) {
                    onSelect(date);
                  }
                }}
                onMouseenter={() => {
                  if (!disabled) {
                    onHover?.(date);
                  }
                }}
                onMouseleave={() => {
                  if (!disabled) {
                    onHover?.(null);
                  }
                }}
              >
                <div class={`${cellPrefixCls.value}-inner`}>{generateConfig.locale.getWeek(locale.locale, date)}</div>
              </td>
            );
          }
        : null;

      // ========================= Cells ==========================
      // >>> Header Cells
      const headerCells = [];
      const weekDaysLocale: string[] =
        locale.shortWeekDays ||
        (generateConfig.locale.getShortWeekDays ? generateConfig.locale.getShortWeekDays(locale.locale) : []);

      if (prefixColumn) {
        headerCells.push(
          <th key="empty">
            <span style={{ width: 0, height: 0, position: 'absolute', overflow: 'hidden', opacity: 0 }}>{locale.week}</span>
          </th>,
        );
      }
      for (let i = 0; i < WEEK_DAY_COUNT; i += 1) {
        headerCells.push(<th key={i}>{weekDaysLocale[(i + weekFirstDay.value) % WEEK_DAY_COUNT]}</th>);
      }

      // >>> Body Cells
      const getCellDate = (date: DateType, offset: number) => {
        return generateConfig.addDate(date, offset);
      };

      const getCellText = (date: DateType) => {
        return formatValue(date, {
          locale,
          format: locale.cellDateFormat,
          generateConfig,
        });
      };

      const getCellClassName = (date: DateType) => {
        const classObj = {
          [`${prefixCls}-cell-in-view`]: isSameMonth(generateConfig, date, pickerValue),
          [`${prefixCls}-cell-today`]: isSameDate(generateConfig, date, now.value),
        };

        return classObj;
      };

      // ========================= Header =========================
      const monthsLocale: string[] =
        locale.shortMonths || (generateConfig.locale.getShortMonths ? generateConfig.locale.getShortMonths(locale.locale) : []);

      const yearNode = (
        <button
          type="button"
          aria-label={locale.yearSelect}
          key="year"
          onClick={() => {
            onModeChange('year', pickerValue);
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
      const monthNode = (
        <button
          type="button"
          aria-label={locale.monthSelect}
          key="month"
          onClick={() => {
            onModeChange('month', pickerValue);
          }}
          tabindex={-1}
          class={`${prefixCls}-month-btn`}
        >
          {locale.monthFormat
            ? formatValue(pickerValue, {
                locale,
                format: locale.monthFormat,
                generateConfig,
              })
            : monthsLocale[month.value]}
        </button>
      );

      const monthYearNodes = locale.monthBeforeYear ? [monthNode, yearNode] : [yearNode, monthNode];

      // ========================= Render =========================
      return (
        <div class={clsx(panelPrefixCls.value, showWeek && `${panelPrefixCls.value}-show-week`)}>
          {/* Header */}
          <PanelHeader
            offset={(distance) => generateConfig.addMonth(pickerValue, distance)}
            superOffset={(distance) => generateConfig.addYear(pickerValue, distance)}
            onChange={onPickerValueChange}
            // Limitation
            getStart={(date) => generateConfig.setDate(date, 1)}
            getEnd={(date) => {
              let clone = generateConfig.setDate(date, 1);
              clone = generateConfig.addMonth(clone, 1);
              return generateConfig.addDate(clone, -1);
            }}
          >
            {monthYearNodes}
          </PanelHeader>

          {/* Body */}
          <PanelBody
            titleFormat={locale.fieldDateFormat}
            {...props}
            colNum={WEEK_DAY_COUNT}
            rowNum={6}
            baseDate={baseDate.value}
            // Header
            headerCells={headerCells}
            // Body
            getCellDate={getCellDate}
            getCellText={getCellText}
            getCellClassName={getCellClassName}
            prefixColumn={prefixColumn}
            cellSelection={!isWeek.value}
          />
        </div>
      );
    };
  },
  { inheritAttrs: false },
);

export default DatePanel;
