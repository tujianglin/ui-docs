import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent } from 'vue';
import type { PopupShowTimeConfig } from '.';
import type { GenerateConfig } from '../../generate';
import useTimeInfo from '../../hooks/useTimeInfo';
import type { DateType, DisabledDate, InternalMode, PanelMode, SharedPickerProps } from '../../interface';
import { usePickerContextInject } from '../context';

export interface FooterProps {
  mode: PanelMode;
  internalMode: InternalMode;
  renderExtraFooter?: SharedPickerProps['renderExtraFooter'];
  showNow: boolean;
  generateConfig: GenerateConfig;
  disabledDate: DisabledDate;
  showTime?: PopupShowTimeConfig;

  // Invalid
  /** From Footer component used only. Check if can OK button click */
  invalid?: boolean;

  // Submit
  onSubmit: (date?: DateType) => void;
  needConfirm: boolean;

  // Now
  onNow: (now: DateType) => void;
}

const Footer = defineComponent(
  ({
    mode,
    internalMode,
    renderExtraFooter,
    showNow,
    showTime,
    onSubmit,
    onNow,
    invalid,
    needConfirm,
    generateConfig,
    disabledDate,
  }: FooterProps) => {
    // @ts-ignore
    const { prefixCls, locale, button: Button = 'button', classNames, styles } = $(usePickerContextInject());

    // >>> Now
    const now = computed(() => generateConfig.getNow());

    const [getValidTime] = useTimeInfo(
      computed(() => generateConfig),
      reactiveComputed(() => showTime || {}),
      now,
    );

    // ======================== Extra =========================
    const extraNode = computed(() => renderExtraFooter?.(mode));

    // ======================== Ranges ========================
    const nowDisabled = computed(() => disabledDate(now.value, { type: mode }));

    const onInternalNow = () => {
      if (!nowDisabled.value) {
        const validateNow = getValidTime(now.value);
        onNow(validateNow);
      }
    };

    const nowPrefixCls = computed(() => `${prefixCls}-now`);
    const nowBtnPrefixCls = computed(() => `${nowPrefixCls.value}-btn`);

    return () => {
      const presetNode = (
        <li v-if={showNow} class={nowPrefixCls.value}>
          <a
            class={clsx(nowBtnPrefixCls.value, nowDisabled.value && `${nowBtnPrefixCls.value}-disabled`)}
            aria-disabled={nowDisabled.value}
            onClick={onInternalNow}
          >
            {internalMode === 'date' ? locale.today : locale.now}
          </a>
        </li>
      );

      // >>> OK
      const okNode = (
        <li v-if={needConfirm} class={`${prefixCls}-ok`}>
          <Button disabled={invalid} onClick={onSubmit}>
            {locale.ok}
          </Button>
        </li>
      );

      const rangeNode = (
        <ul v-if={presetNode || okNode} class={`${prefixCls}-ranges`}>
          {presetNode}
          {okNode}
        </ul>
      );

      // ======================== Render ========================
      if (!extraNode.value && !rangeNode) {
        return null;
      }

      return (
        <div class={clsx(`${prefixCls}-footer`, classNames.popup.footer)} style={styles.popup.footer}>
          {extraNode.value && <div class={`${prefixCls}-footer-extra`}>{extraNode.value}</div>}
          {rangeNode}
        </div>
      );
    };
  },
  { inheritAttrs: false },
);

export default Footer;
