import { clsx } from 'clsx';
import { computed } from 'vue';

interface IndentProps {
  prefixCls: string;
  level: number;
  isStart: boolean[];
  isEnd: boolean[];
}

const Indent = ({ prefixCls, level, isStart, isEnd }: IndentProps) => {
  const baseClassName = computed(() => `${prefixCls}-indent-unit`);

  return (
    <span aria-hidden="true" class={`${prefixCls}-indent`}>
      <span
        v-for={i in level}
        key={i}
        class={clsx(baseClassName.value, {
          [`${baseClassName.value}-start`]: isStart[i],
          [`${baseClassName.value}-end`]: isEnd[i],
        })}
      />
    </span>
  );
};

export default Indent;
