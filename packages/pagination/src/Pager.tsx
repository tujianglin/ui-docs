import { clsx } from 'clsx';
import { computed, defineComponent, type CSSProperties } from 'vue';
import type { KeyboardEvent } from 'vue-jsx-vapor';
import type { PaginationProps } from './interface';

export interface PagerProps extends Pick<PaginationProps, 'itemRender'> {
  rootPrefixCls: string;
  page: number;
  active?: boolean;
  class?: string;
  style?: CSSProperties;
  showTitle: boolean;
  onClick?: (page: number) => void;
  onKeypress?: (e: KeyboardEvent<HTMLLIElement>, onClick: PagerProps['onClick'], page: PagerProps['page']) => void;
}

const Pager = defineComponent(
  ({ rootPrefixCls, page, active, class: className, style, showTitle, onClick, onKeypress, itemRender }: PagerProps) => {
    const prefixCls = computed(() => `${rootPrefixCls}-item`);

    const cls = computed(() =>
      clsx(
        prefixCls.value,
        `${prefixCls.value}-${page}`,
        {
          [`${prefixCls.value}-active`]: active,
          [`${prefixCls.value}-disabled`]: !page,
        },
        className,
      ),
    );

    const handleClick = () => {
      onClick(page);
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLLIElement>) => {
      onKeypress(e, onClick, page);
    };

    const pager = computed(() => itemRender(page, 'page', <a rel="nofollow">{page}</a>));

    return () => (
      <li
        v-if={pager.value}
        title={showTitle ? String(page) : null}
        class={cls.value}
        style={style}
        onClick={handleClick}
        onKeydown={handleKeyPress}
        tabindex={0}
      >
        {pager.value}
      </li>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'Pager' : undefined },
);

export default Pager;
