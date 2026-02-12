import type { VueNode } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { computed, defineComponent, getCurrentInstance, type CSSProperties } from 'vue';
import { Color } from './color';
import ColorBlock from './components/ColorBlock';
import Picker from './components/Picker';
import useColorState from './hooks/useColorState';
import useComponent, { type Components } from './hooks/useComponent';
import type { BaseColorPickerProps, ColorGenInput } from './interface';
import { ColorPickerPrefixCls, defaultColor } from './util';

const HUE_COLORS = [
  {
    color: 'rgb(255, 0, 0)',
    percent: 0,
  },
  {
    color: 'rgb(255, 255, 0)',
    percent: 17,
  },
  {
    color: 'rgb(0, 255, 0)',
    percent: 33,
  },
  {
    color: 'rgb(0, 255, 255)',
    percent: 50,
  },
  {
    color: 'rgb(0, 0, 255)',
    percent: 67,
  },
  {
    color: 'rgb(255, 0, 255)',
    percent: 83,
  },
  {
    color: 'rgb(255, 0, 0)',
    percent: 100,
  },
];

export interface ColorPickerProps extends Omit<BaseColorPickerProps, 'color'> {
  value?: ColorGenInput;
  defaultValue?: ColorGenInput;
  class?: string;
  style?: CSSProperties;
  /** Get panel element  */
  panelRender?: (panel: VueNode) => VueNode;
  /** Disabled alpha selection */
  disabledAlpha?: boolean;
  components?: Components;
}

const ColorPicker = defineComponent(
  ({
    value,
    defaultValue,
    prefixCls = ColorPickerPrefixCls,
    onChange,
    onChangeComplete,
    class: className,
    style,
    panelRender,
    disabledAlpha = false,
    disabled = false,
    components,
  }: ColorPickerProps) => {
    // ========================== Components ==========================
    const Slider = useComponent(computed(() => components));

    // ============================ Color =============================
    const [colorValue, setColorValue] = useColorState(
      defaultValue || defaultColor,
      computed(() => value),
    );
    const alphaColor = computed(() => colorValue.value.setA(1).toRgbString());

    // ============================ Events ============================
    const handleChange: BaseColorPickerProps['onChange'] = (data, type) => {
      if (!value) {
        setColorValue(data);
      }
      onChange?.(data, type);
    };

    // Convert
    const getHueColor = (hue: number) => new Color(colorValue.value.setHue(hue));

    const getAlphaColor = (alpha: number) => new Color(colorValue.value.setA(alpha / 100));

    // Slider change
    const onHueChange = (hue: number) => {
      handleChange(getHueColor(hue), { type: 'hue', value: hue });
    };

    const onAlphaChange = (alpha: number) => {
      handleChange(getAlphaColor(alpha), { type: 'alpha', value: alpha });
    };

    // Complete
    const onHueChangeComplete = (hue: number) => {
      if (onChangeComplete) {
        onChangeComplete(getHueColor(hue));
      }
    };

    const onAlphaChangeComplete = (alpha: number) => {
      if (onChangeComplete) {
        onChangeComplete(getAlphaColor(alpha));
      }
    };

    // ============================ Render ============================
    const mergeCls = computed(() =>
      clsx(`${prefixCls}-panel`, className, {
        [`${prefixCls}-panel-disabled`]: disabled,
      }),
    );

    const sharedSliderProps = computed(() => ({
      prefixCls,
      disabled,
      color: colorValue.value,
    }));

    const vm = getCurrentInstance();
    const changeRef = (el) => {
      vm.exposed = el || {};
      vm.exposeProxy = el || {};
    };

    return () => {
      const defaultPanel = (
        <>
          <Picker onChange={handleChange} {...sharedSliderProps.value} onChangeComplete={onChangeComplete} />
          <div class={`${prefixCls}-slider-container`}>
            <div
              class={clsx(`${prefixCls}-slider-group`, {
                [`${prefixCls}-slider-group-disabled-alpha`]: disabledAlpha,
              })}
            >
              <Slider.value
                {...sharedSliderProps.value}
                type="hue"
                colors={HUE_COLORS}
                min={0}
                max={359}
                value={colorValue.value.getHue()}
                onChange={onHueChange}
                onChangeComplete={onHueChangeComplete}
              />
              <Slider.value
                v-if={!disabledAlpha}
                {...sharedSliderProps.value}
                type="alpha"
                colors={[
                  { percent: 0, color: 'rgba(255, 0, 4, 0)' },
                  { percent: 100, color: alphaColor.value },
                ]}
                min={0}
                max={100}
                value={colorValue.value.a * 100}
                onChange={onAlphaChange}
                onChangeComplete={onAlphaChangeComplete}
              />
            </div>
            <ColorBlock color={colorValue.value.toRgbString()} prefixCls={prefixCls} />
          </div>
        </>
      );

      return (
        <div class={mergeCls.value} style={style} ref={changeRef}>
          {typeof panelRender === 'function' ? panelRender(defaultPanel) : defaultPanel}
        </div>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'ColorPicker' : undefined },
);

export default ColorPicker;
