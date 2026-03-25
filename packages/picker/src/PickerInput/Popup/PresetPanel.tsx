import { defineComponent } from 'vue';
import type { DateType, ValueDate } from '../../interface';

export interface PresetPanelProps {
  prefixCls: string;
  presets: ValueDate[];
  onClick: (value: DateType) => void;
  onHover: (value: DateType) => void;
}

function executeValue(value: ValueDate['value']): DateType {
  return typeof value === 'function' ? value() : value;
}

const PresetPanel = defineComponent(
  ({ prefixCls, presets, onClick, onHover }: PresetPanelProps) => {
    return () => {
      if (!presets?.length) {
        return null;
      }

      return (
        <div class={`${prefixCls}-presets`}>
          <ul>
            <li
              v-for={({ label, value }, index) in presets}
              key={index}
              onClick={() => {
                onClick(executeValue(value));
              }}
              onMouseenter={() => {
                onHover(executeValue(value));
              }}
              onMouseleave={() => {
                onHover(null);
              }}
            >
              {label}
            </li>
          </ul>
        </div>
      );
    };
  },
  { inheritAttrs: false },
);

export default PresetPanel;
