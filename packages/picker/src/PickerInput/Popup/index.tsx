import ResizeObserver, { type ResizeObserverProps } from '@vc-com/resize-observer';
import { clsx } from 'clsx';
import { omit } from 'es-toolkit';
import { computed, defineComponent, ref, watch } from 'vue';
import { useFullProps, useRef, type InputHTMLAttributes, type MouseEventHandler } from 'vue-jsx-vapor';
import type { DateType, RangeTimeProps, SharedPickerProps, SharedTimeProps, ValueDate } from '../../interface';
import { toArray } from '../../utils/miscUtil';
import { usePickerContextInject } from '../context';
import Footer, { type FooterProps } from './Footer';
import PopupPanel, { type PopupPanelProps } from './PopupPanel';
import PresetPanel from './PresetPanel';

export type PopupShowTimeConfig = Omit<RangeTimeProps, 'defaultValue' | 'defaultOpenValue' | 'disabledTime'> &
  Pick<SharedTimeProps, 'disabledTime'>;

export interface PopupProps
  extends Pick<InputHTMLAttributes<HTMLDivElement>, 'onFocus' | 'onBlur'>, FooterProps, PopupPanelProps {
  panelRender?: SharedPickerProps['panelRender'];

  // Presets
  presets: ValueDate[];
  onPresetHover: (presetValue: DateType) => void;
  onPresetSubmit: (presetValue: DateType) => void;

  // Range
  activeInfo?: [activeInputLeft: number, activeInputRight: number, selectorWidth: number];
  // Direction
  direction?: 'ltr' | 'rtl';

  // Fill
  /** TimePicker or showTime only */
  defaultOpenValue: DateType;

  // Change
  needConfirm: boolean;
  isInvalid: (date: DateType | DateType[]) => boolean;
  onOk: VoidFunction;

  onPanelMouseDown?: MouseEventHandler<HTMLDivElement>;

  classNames?: SharedPickerProps['classNames'];
  styles?: SharedPickerProps['styles'];
}

const Popup = defineComponent(
  ({
    panelRender,
    internalMode,
    picker,
    showNow,

    // Range
    range,
    multiple,
    activeInfo = [0, 0, 0],

    // Presets
    presets,
    onPresetHover,
    onPresetSubmit,

    // Focus
    onFocus,
    onBlur,
    onPanelMouseDown,

    // Direction
    direction,

    // Change
    value,
    onSelect,
    isInvalid,
    defaultOpenValue,
    onOk,
    onSubmit,
    classNames,
    styles,
  }: PopupProps) => {
    const props = useFullProps() as PopupProps;
    const { prefixCls } = $(usePickerContextInject());
    const panelPrefixCls = computed(() => `${prefixCls}-panel`);

    const rtl = computed(() => direction === 'rtl');

    // ========================= Refs =========================
    const arrowRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // ======================== Offset ========================
    const containerWidth = ref<number>(0);
    const containerOffset = ref<number>(0);
    const arrowOffset = ref<number>(0);

    const onResize: ResizeObserverProps['onResize'] = (info) => {
      if (info.width) {
        containerWidth.value = info.width;
      }
    };

    const activeInputLeft = computed(() => activeInfo[0]);
    const activeInputRight = computed(() => activeInfo[1]);
    const selectorWidth = computed(() => activeInfo[2]);
    const retryTimes = ref(0);

    watch(
      activeInputLeft,
      () => {
        retryTimes.value = 10;
      },
      { immediate: true },
    );

    watch([retryTimes, rtl, containerWidth, activeInputLeft, activeInputRight, selectorWidth, () => range], () => {
      // `activeOffset` is always align with the active input element
      // So we need only check container contains the `activeOffset`
      if (range && wrapperRef.value) {
        // Offset in case container has border radius
        const arrowWidth = arrowRef.value?.offsetWidth || 0;

        // Arrow Offset
        const wrapperRect = wrapperRef.value.getBoundingClientRect();
        if (!wrapperRect.height || wrapperRect.right < 0) {
          retryTimes.value = Math.max(0, retryTimes.value - 1);
          return;
        }

        const nextArrowOffset = (rtl.value ? activeInputRight.value - arrowWidth : activeInputLeft.value) - wrapperRect.left;
        arrowOffset.value = nextArrowOffset;

        // Container Offset
        if (containerWidth.value && containerWidth.value < selectorWidth.value) {
          const offset = rtl
            ? wrapperRect.right - (activeInputRight.value - arrowWidth + containerWidth.value)
            : activeInputLeft.value + arrowWidth - wrapperRect.left - containerWidth.value;

          const safeOffset = Math.max(0, offset);
          containerOffset.value = safeOffset;
        } else {
          containerOffset.value = 0;
        }
      }
    });

    // ======================== Custom ========================
    function filterEmpty<T>(list: T[]) {
      return list.filter((item) => item);
    }

    const valueList = computed(() => filterEmpty(toArray(value)));

    const isTimePickerEmptyValue = computed(() => picker === 'time' && !valueList.value?.length);

    const footerSubmitValue = computed(() => {
      if (isTimePickerEmptyValue.value) {
        return filterEmpty([defaultOpenValue]);
      }
      return valueList.value;
    });

    const popupPanelValue = computed(() => (isTimePickerEmptyValue.value ? defaultOpenValue : valueList.value));

    const disableSubmit = computed(() => {
      // Empty is invalid
      if (!footerSubmitValue.value.length) {
        return true;
      }

      return footerSubmitValue.value.some((val) => isInvalid(val));
    });

    const onFooterSubmit = () => {
      // For TimePicker, we will additional trigger the value update
      if (isTimePickerEmptyValue.value) {
        onSelect(defaultOpenValue);
      }

      onOk();
      onSubmit();
    };
    return () => {
      let mergedNodes = (
        <div class={`${prefixCls}-panel-layout`}>
          {/* `any` here since PresetPanel is reused for both Single & Range Picker which means return type is not stable */}
          <PresetPanel prefixCls={prefixCls} presets={presets} onClick={onPresetSubmit} onHover={onPresetHover} />
          <div>
            <PopupPanel {...props} value={popupPanelValue.value} />
            <Footer
              {...omit(props, ['onSubmit'])}
              showNow={multiple ? false : showNow}
              invalid={disableSubmit.value}
              onSubmit={onFooterSubmit}
            />
          </div>
        </div>
      );

      if (panelRender) {
        mergedNodes = panelRender(mergedNodes) as JSX.Element;
      }

      // ======================== Render ========================
      const containerPrefixCls = `${panelPrefixCls.value}-container`;

      const marginLeft = 'marginLeft';
      const marginRight = 'marginRight';

      // Container
      let renderNode = (
        <div
          tabindex={-1}
          class={clsx(
            containerPrefixCls,
            // Used for Today Button style, safe to remove if no need
            `${prefixCls}-${internalMode}-panel-container`,
            classNames?.popup?.container,
          )}
          style={{
            [rtl.value ? marginRight : marginLeft]: `${containerOffset.value}px`,
            [rtl.value ? marginLeft : marginRight]: 'auto',
            ...styles?.popup?.container,
          }}
          {...{
            // Keep focus on the selector while interacting with the popup
            // so cell click handlers can run before any blur-close sequence.
            onMousedown: (e) => {
              e.preventDefault();
              onPanelMouseDown?.(e);
            },
            onFocus,
            onBlur,
          }}
        >
          {mergedNodes}
        </div>
      );

      if (range) {
        return (
          <div
            ref={wrapperRef}
            class={clsx(`${prefixCls}-range-wrapper`, `${prefixCls}-${picker}-range-wrapper`)}
            {...{
              onMousedown: (e) => {
                e.preventDefault();
                onPanelMouseDown?.(e);
              },
            }}
          >
            <div ref={arrowRef} class={`${prefixCls}-range-arrow`} style={{ left: `${arrowOffset.value}px` }} />

            {/* Watch for container size */}
            <ResizeObserver onResize={onResize}>{renderNode}</ResizeObserver>
          </div>
        );
      }
      return renderNode;
    };
  },
  { inheritAttrs: false },
);

export default Popup;
