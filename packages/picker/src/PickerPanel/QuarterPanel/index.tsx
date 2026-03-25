import { reactiveComputed } from '@vueuse/core';
import { computed, defineComponent } from 'vue';
import { useFullProps } from 'vue-jsx-vapor';
import type { DateType, SharedPanelProps } from '../../interface';
import { formatValue } from '../../utils/dateUtil';
import { useInfo, usePanelContextProvider } from '../context';
import PanelBody from '../PanelBody';
import PanelHeader from '../PanelHeader';

const QuarterPanel = defineComponent(
  ({ prefixCls, locale, generateConfig, pickerValue, onPickerValueChange, onModeChange }: SharedPanelProps) => {
    const props = useFullProps() as SharedPanelProps;
    const panelPrefixCls = computed(() => `${prefixCls}-quarter-panel`);

    // ========================== Base ==========================
    const [info] = useInfo(
      reactiveComputed(() => props),
      computed(() => 'quarter'),
    );
    const baseDate = computed(() => generateConfig.setMonth(pickerValue, 0));

    // ========================= Cells ==========================
    const getCellDate = (date: DateType, offset: number) => {
      return generateConfig.addMonth(date, offset * 3);
    };

    const getCellText = (date: DateType) => {
      return formatValue(date, {
        locale,
        format: locale.cellQuarterFormat,
        generateConfig,
      });
    };

    const getCellClassName = () => ({
      [`${prefixCls}-cell-in-view`]: true,
    });

    usePanelContextProvider(info);

    return () => {
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
            titleFormat={locale.fieldQuarterFormat}
            colNum={4}
            rowNum={1}
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

export default QuarterPanel;
