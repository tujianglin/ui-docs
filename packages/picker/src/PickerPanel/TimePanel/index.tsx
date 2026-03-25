import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent } from 'vue';
import { useFullProps } from 'vue-jsx-vapor';
import type { SharedPanelProps } from '../../interface';
import { formatValue } from '../../utils/dateUtil';
import { useInfo, usePanelContextProvider } from '../context';
import PanelHeader from '../PanelHeader';
import TimePanelBody from './TimePanelBody';

export type TimePanelProps = SharedPanelProps;

const TimePanel = defineComponent(
  ({
    prefixCls,
    value,
    locale,
    generateConfig,

    // Format
    showTime,
  }: TimePanelProps) => {
    const props = useFullProps() as TimePanelProps;

    const { format } = $(reactiveComputed(() => showTime || {}));

    const panelPrefixCls = computed(() => `${prefixCls}-time-panel`);

    // ========================== Base ==========================
    // @ts-ignore
    const [info] = useInfo(
      props,
      computed(() => 'time'),
    );

    usePanelContextProvider(info);
    // ========================= Render =========================
    return () => (
      <div class={clsx(panelPrefixCls.value)}>
        <PanelHeader>{value ? formatValue(value, { locale, format, generateConfig }) : '\u00A0'}</PanelHeader>
        <TimePanelBody {...showTime} />
      </div>
    );
  },
  { inheritAttrs: false },
);

export default TimePanel;
