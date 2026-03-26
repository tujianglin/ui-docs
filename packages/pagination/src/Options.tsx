import KEYCODE from '@vc-com/util/lib/KeyCode';
import type { VueNode } from '@vc-com/util/lib/types';
import { computed, defineComponent, ref } from 'vue';
import type { FocusEvent } from 'vue-jsx-vapor';
import type { PaginationLocale } from './interface';

export type SizeChangerRender = (info: {
  disabled: boolean;
  size: number;
  onSizeChange: (value: string | number) => void;
  'aria-label': string;
  class: string;
  options: {
    label: string;
    value: string | number;
  }[];
}) => VueNode;

interface OptionsProps {
  disabled?: boolean;
  locale: PaginationLocale;
  rootPrefixCls: string;
  selectPrefixCls?: string;
  pageSize: number;
  pageSizeOptions?: number[];
  goButton?: boolean | string;
  changeSize?: (size: number) => void;
  quickGo?: (value: number) => void;
  buildOptionText?: (value: number | string) => string;
  showSizeChanger: boolean;
  sizeChangerRender?: SizeChangerRender;
}

const defaultPageSizeOptions = [10, 20, 50, 100];

const Options = defineComponent(
  ({
    pageSizeOptions = defaultPageSizeOptions,
    locale,
    changeSize,
    pageSize,
    goButton,
    quickGo,
    rootPrefixCls,
    disabled,
    buildOptionText,
    showSizeChanger,
    sizeChangerRender,
  }: OptionsProps) => {
    const goInputText = ref('');

    const getValidValue = computed<number>(() => {
      return !goInputText.value || Number.isNaN(goInputText.value) ? undefined : Number(goInputText.value);
    });

    const mergeBuildOptionText = computed(() =>
      typeof buildOptionText === 'function' ? buildOptionText : (value: string | number) => `${value} ${locale.items_per_page}`,
    );

    const handleChange = (e) => {
      const value = e.target.value;
      if (/^\d*$/.test(value)) {
        goInputText.value = value;
      }
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement, Element>) => {
      if (goButton || goInputText.value === '') {
        return;
      }
      goInputText.value = '';
      if (
        e.relatedTarget &&
        (e.relatedTarget.className.includes(`${rootPrefixCls}-item-link`) ||
          e.relatedTarget.className.includes(`${rootPrefixCls}-item`))
      ) {
        return;
      }
      quickGo?.(getValidValue.value);
    };

    const go = (e: any) => {
      if (goInputText.value === '') {
        return;
      }
      if (e.keyCode === KEYCODE.ENTER || e.type === 'click') {
        goInputText.value = '';
        quickGo?.(getValidValue.value);
      }
    };

    const getPageSizeOptions = () => {
      if (pageSizeOptions.some((option) => option.toString() === pageSize.toString())) {
        return pageSizeOptions;
      }
      return pageSizeOptions.concat([pageSize]).sort((a, b) => {
        const numberA = Number.isNaN(Number(a)) ? 0 : Number(a);
        const numberB = Number.isNaN(Number(b)) ? 0 : Number(b);
        return numberA - numberB;
      });
    };

    // ============== render ==============
    return () => {
      // ============== cls ==============
      const prefixCls = `${rootPrefixCls}-options`;
      if (!showSizeChanger && !quickGo) {
        return null;
      }

      let changeSelect: VueNode = null;
      let goInput: VueNode = null;
      let gotoButton: VueNode = null;

      // >>>>> Size Changer
      if (showSizeChanger && sizeChangerRender) {
        changeSelect = sizeChangerRender({
          disabled,
          size: pageSize,
          onSizeChange: (nextValue) => {
            changeSize?.(Number(nextValue));
          },
          'aria-label': locale.page_size,
          class: `${prefixCls}-size-changer`,
          options: getPageSizeOptions().map((opt) => ({
            label: mergeBuildOptionText.value(opt),
            value: opt,
          })),
        });
      }

      // >>>>> Quick Go
      if (quickGo) {
        if (goButton) {
          gotoButton =
            typeof goButton === 'boolean' ? (
              <button type="button" onClick={go} onKeyup={go} disabled={disabled} class={`${prefixCls}-quick-jumper-button`}>
                {locale.jump_to_confirm}
              </button>
            ) : (
              <span onClick={go} onKeyup={go}>
                {goButton}
              </span>
            );
        }

        goInput = (
          <div class={`${prefixCls}-quick-jumper`}>
            {locale.jump_to}
            <input
              disabled={disabled}
              type="text"
              value={goInputText.value}
              onInput={handleChange}
              onKeyup={go}
              onBlur={handleBlur}
              aria-label={locale.page}
            />
            {locale.page}
            {gotoButton}
          </div>
        );
      }

      return (
        <li class={prefixCls}>
          {changeSelect}
          {goInput}
        </li>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'Options' : undefined },
);

export default Options;
