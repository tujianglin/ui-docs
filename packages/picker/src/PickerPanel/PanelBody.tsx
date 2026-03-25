import { clsx } from 'clsx';
import { computed, defineComponent } from 'vue';
import type { RenderNode } from '../../../util/src/types';
import type { DateType, DisabledDate } from '../interface';
import { formatValue, isInRange, isSame } from '../utils/dateUtil';
import { usePanelContextInject, usePickerHackContextInject } from './context';

export interface PanelBodyProps {
  rowNum: number;
  colNum: number;
  baseDate: DateType;

  titleFormat?: string;

  // Render
  getCellDate: (date: DateType, offset: number) => DateType;
  getCellText: (date: DateType) => RenderNode;
  getCellClassName: (date: DateType) => Record<string, any>;

  disabledDate?: DisabledDate;

  // Used for date panel
  headerCells?: RenderNode[];

  // Used for week panel
  prefixColumn?: (date: DateType) => RenderNode;
  rowClassName?: (date: DateType) => string;
  cellSelection?: boolean;
}

const PanelBody = defineComponent(
  ({
    rowNum,
    colNum,
    baseDate,
    getCellDate,
    prefixColumn,
    rowClassName,
    titleFormat,
    getCellText,
    getCellClassName,
    headerCells,
    cellSelection = true,
    disabledDate,
  }: PanelBodyProps) => {
    const {
      prefixCls,
      classNames,
      styles,
      panelType: type,
      now,
      disabledDate: contextDisabledDate,
      cellRender,
      onHover,
      hoverValue,
      hoverRangeValue,
      generateConfig,
      values,
      locale,
      onSelect,
    } = $(usePanelContextInject());

    const mergedDisabledDate = computed(() => disabledDate || contextDisabledDate);

    const cellPrefixCls = computed(() => `${prefixCls}-cell`);

    // ============================= Context ==============================
    const { onCellDblClick } = $(usePickerHackContextInject());

    // ============================== Value ===============================
    const matchValues = (date: DateType) =>
      values.some((singleValue) => singleValue && isSame(generateConfig, locale, date, singleValue, type));

    return () => {
      // =============================== Body ===============================
      const rows: RenderNode[] = [];

      for (let row = 0; row < rowNum; row += 1) {
        const rowNode: RenderNode[] = [];
        let rowStartDate: DateType;

        for (let col = 0; col < colNum; col += 1) {
          const offset = row * colNum + col;
          const currentDate = getCellDate(baseDate, offset);

          const disabled = mergedDisabledDate.value?.(currentDate, {
            type: type,
          });

          // Row Start Cell
          if (col === 0) {
            rowStartDate = currentDate;

            if (prefixColumn) {
              rowNode.push(prefixColumn(rowStartDate));
            }
          }

          // Range
          let inRange = false;
          let rangeStart = false;
          let rangeEnd = false;

          if (cellSelection && hoverRangeValue) {
            const [hoverStart, hoverEnd] = hoverRangeValue;
            inRange = isInRange(generateConfig, hoverStart, hoverEnd, currentDate);
            rangeStart = isSame(generateConfig, locale, currentDate, hoverStart, type);
            rangeEnd = isSame(generateConfig, locale, currentDate, hoverEnd, type);
          }

          // Title
          const title = titleFormat
            ? formatValue(currentDate, {
                locale,
                format: titleFormat,
                generateConfig,
              })
            : undefined;

          // Render
          const inner = <div class={`${cellPrefixCls.value}-inner`}>{getCellText(currentDate)}</div>;
          rowNode.push(
            <td
              key={col}
              title={title}
              class={clsx(cellPrefixCls.value, classNames.item, {
                [`${cellPrefixCls.value}-disabled`]: disabled,
                [`${cellPrefixCls.value}-hover`]: (hoverValue || []).some((date) =>
                  isSame(generateConfig, locale, currentDate, date, type),
                ),
                [`${cellPrefixCls.value}-in-range`]: inRange && !rangeStart && !rangeEnd,
                [`${cellPrefixCls.value}-range-start`]: rangeStart,
                [`${cellPrefixCls.value}-range-end`]: rangeEnd,
                [`${prefixCls}-cell-selected`]:
                  !hoverRangeValue &&
                  // WeekPicker use row instead
                  type !== 'week' &&
                  matchValues(currentDate),
                ...getCellClassName(currentDate),
              })}
              style={styles.item}
              onClick={() => {
                if (!disabled) {
                  onSelect(currentDate);
                }
              }}
              onDblclick={() => {
                if (!disabled && onCellDblClick) {
                  onCellDblClick();
                }
              }}
              onMouseenter={() => {
                if (!disabled) {
                  onHover?.(currentDate);
                }
              }}
              onMouseleave={() => {
                if (!disabled) {
                  onHover?.(null);
                }
              }}
            >
              {cellRender
                ? cellRender(currentDate, {
                    prefixCls,
                    originNode: inner,
                    today: now,
                    type: type,
                    locale,
                  })
                : inner}
            </td>,
          );
        }

        rows.push(
          <tr key={row} class={rowClassName?.(rowStartDate!)}>
            {rowNode}
          </tr>,
        );
      }

      // ============================== Render ==============================
      return (
        <div class={clsx(`${prefixCls}-body`, classNames.body)} style={styles.body}>
          <table class={clsx(`${prefixCls}-content`, classNames.content)} style={styles.content}>
            <thead v-if={headerCells}>
              <tr>{headerCells}</tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
      );
    };
  },
  { inheritAttrs: false },
);

export default PanelBody;
