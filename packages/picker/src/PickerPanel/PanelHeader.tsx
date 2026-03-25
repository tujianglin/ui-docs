import { clsx } from 'clsx';
import { computed, defineComponent, type CSSProperties } from 'vue';
import type { DateType } from '../interface';
import { isSameOrAfter } from '../utils/dateUtil';
import { usePanelContextInject, usePickerHackContextInject } from './context';

const HIDDEN_STYLE: CSSProperties = {
  visibility: 'hidden',
};

export interface HeaderProps {
  offset?: (distance: number, date: DateType) => DateType;
  superOffset?: (distance: number, date: DateType) => DateType;
  onChange?: (date: DateType) => void;

  // Limitation
  getStart?: (date: DateType) => DateType;
  getEnd?: (date: DateType) => DateType;
}

const PanelHeader = defineComponent(
  ({
    offset,
    superOffset,
    onChange,

    getStart,
    getEnd,
  }: HeaderProps) => {
    const {
      prefixCls,
      classNames,
      styles,

      // Icons
      // @ts-ignore
      prevIcon = '\u2039',
      nextIcon = '\u203A',
      superPrevIcon = '\u00AB',
      superNextIcon = '\u00BB',

      // Limitation
      minDate,
      maxDate,
      generateConfig,
      locale,
      pickerValue,
      panelType: type,
    } = $(usePanelContextInject());

    const headerPrefixCls = computed(() => `${prefixCls}-header`);

    const { hidePrev, hideNext, hideHeader } = $(usePickerHackContextInject());

    // ======================= Limitation =======================
    const disabledOffsetPrev = computed(() => {
      if (!minDate || !offset || !getEnd) {
        return false;
      }

      const prevPanelLimitDate = getEnd(offset(-1, pickerValue));

      return !isSameOrAfter(generateConfig, locale, prevPanelLimitDate, minDate, type);
    });

    const disabledSuperOffsetPrev = computed(() => {
      if (!minDate || !superOffset || !getEnd) {
        return false;
      }

      const prevPanelLimitDate = getEnd(superOffset(-1, pickerValue));

      return !isSameOrAfter(generateConfig, locale, prevPanelLimitDate, minDate, type);
    });

    const disabledOffsetNext = computed(() => {
      if (!maxDate || !offset || !getStart) {
        return false;
      }

      const nextPanelLimitDate = getStart(offset(1, pickerValue));

      return !isSameOrAfter(generateConfig, locale, maxDate, nextPanelLimitDate, type);
    });

    const disabledSuperOffsetNext = computed(() => {
      if (!maxDate || !superOffset || !getStart) {
        return false;
      }

      const nextPanelLimitDate = getStart(superOffset(1, pickerValue));

      return !isSameOrAfter(generateConfig, locale, maxDate, nextPanelLimitDate, type);
    });

    // ========================= Offset =========================
    const onOffset = (distance: number) => {
      if (offset) {
        onChange(offset(distance, pickerValue));
      }
    };

    const onSuperOffset = (distance: number) => {
      if (superOffset) {
        onChange(superOffset(distance, pickerValue));
      }
    };

    // ========================= Render =========================
    return () => {
      if (hideHeader) {
        return null;
      }

      const prevBtnCls = `${headerPrefixCls.value}-prev-btn`;
      const nextBtnCls = `${headerPrefixCls.value}-next-btn`;
      const superPrevBtnCls = `${headerPrefixCls.value}-super-prev-btn`;
      const superNextBtnCls = `${headerPrefixCls.value}-super-next-btn`;

      return (
        <div class={clsx(headerPrefixCls.value, classNames.header)} style={styles.header}>
          <button
            v-if={superOffset}
            type="button"
            aria-label={locale.previousYear}
            onClick={() => onSuperOffset(-1)}
            tabindex={-1}
            class={clsx(superPrevBtnCls, disabledSuperOffsetPrev.value && `${superPrevBtnCls}-disabled`)}
            disabled={disabledSuperOffsetPrev.value}
            style={hidePrev ? HIDDEN_STYLE : {}}
          >
            {superPrevIcon}
          </button>
          <button
            v-if={offset}
            type="button"
            aria-label={locale.previousMonth}
            onClick={() => onOffset(-1)}
            tabindex={-1}
            class={clsx(prevBtnCls, disabledOffsetPrev.value && `${prevBtnCls}-disabled`)}
            disabled={disabledOffsetPrev.value}
            style={hidePrev ? HIDDEN_STYLE : {}}
          >
            {prevIcon}
          </button>
          <div class={`${headerPrefixCls.value}-view`}>
            <slot></slot>
          </div>
          <button
            v-if={offset}
            type="button"
            aria-label={locale.nextMonth}
            onClick={() => onOffset(1)}
            tabindex={-1}
            class={clsx(nextBtnCls, disabledOffsetNext.value && `${nextBtnCls}-disabled`)}
            disabled={disabledOffsetNext.value}
            style={hideNext ? HIDDEN_STYLE : {}}
          >
            {nextIcon}
          </button>
          <button
            v-if={superOffset}
            type="button"
            aria-label={locale.nextYear}
            onClick={() => onSuperOffset(1)}
            tabindex={-1}
            class={clsx(superNextBtnCls, disabledSuperOffsetNext.value && `${superNextBtnCls}-disabled`)}
            disabled={disabledSuperOffsetNext.value}
            style={hideNext ? HIDDEN_STYLE : {}}
          >
            {superNextIcon}
          </button>
        </div>
      );
    };
  },
  { inheritAttrs: false },
);

export default PanelHeader;
