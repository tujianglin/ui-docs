import { computed, defineComponent } from 'vue';
import { useFullProps } from 'vue-jsx-vapor';
import type { DateType } from '../../interface';
import PickerPanel, { type PickerPanelProps } from '../../PickerPanel';
import { PickerHackContextProvider, type PickerHackContextProps } from '../../PickerPanel/context';
import { usePickerContextInject } from '../context';
import { offsetPanelDate } from '../hooks/useRangePickerValue';
import { type FooterProps } from './Footer';

export type MustProp = Required<Pick<PickerPanelProps, 'mode' | 'onPanelChange'>>;

export type PopupPanelProps = MustProp &
  Omit<PickerPanelProps, 'onPickerValueChange' | 'showTime'> &
  FooterProps & {
    multiplePanel?: boolean;
    range?: boolean;

    onPickerValueChange: (date: DateType) => void;
  };

const PopupPanel = defineComponent(
  ({ picker, multiplePanel, pickerValue, onPickerValueChange, needConfirm, onSubmit, range, hoverValue }: PopupPanelProps) => {
    const props = useFullProps() as PopupPanelProps;
    const { prefixCls, generateConfig } = $(usePickerContextInject());

    // ======================== Offset ========================
    const internalOffsetDate = (date: DateType, offset: number) => {
      return offsetPanelDate(generateConfig, picker, date, offset);
    };

    const nextPickerValue = computed(() => internalOffsetDate(pickerValue, 1));

    // Outside
    const onSecondPickerValueChange = (nextDate: DateType) => {
      onPickerValueChange(internalOffsetDate(nextDate, -1));
    };

    // ======================= Context ========================
    const sharedContext: PickerHackContextProps = {
      onCellDblClick: () => {
        if (needConfirm) {
          onSubmit();
        }
      },
    };

    const hideHeader = computed(() => picker === 'time');

    // ======================== Props =========================
    const pickerProps = computed(() => {
      const result = {
        ...props,
        hoverValue: null,
        hoverRangeValue: null,
        hideHeader: hideHeader.value,
      };
      if (range) {
        result.hoverRangeValue = hoverValue;
      } else {
        result.hoverValue = hoverValue;
      }
      return result;
    });

    // ======================== Render ========================
    return () => {
      // Multiple
      if (multiplePanel) {
        return (
          <div class={`${prefixCls}-panels`}>
            <PickerHackContextProvider
              value={{
                ...sharedContext,
                hideNext: true,
              }}
            >
              <PickerPanel {...pickerProps.value} />
            </PickerHackContextProvider>
            <PickerHackContextProvider
              value={{
                ...sharedContext,
                hidePrev: true,
              }}
            >
              <PickerPanel
                {...pickerProps.value}
                pickerValue={nextPickerValue.value}
                onPickerValueChange={onSecondPickerValueChange}
              />
            </PickerHackContextProvider>
          </div>
        );
      }

      // Single
      return (
        <PickerHackContextProvider
          value={{
            ...sharedContext,
          }}
        >
          <PickerPanel {...pickerProps.value} />
        </PickerHackContextProvider>
      );
    };
  },
  { inheritAttrs: false },
);

export default PopupPanel;
