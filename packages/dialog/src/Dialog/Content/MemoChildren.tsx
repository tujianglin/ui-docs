import { defineComponent } from 'vue';

export type MemoChildrenProps = {
  shouldUpdate: boolean;
};

export default defineComponent(({ shouldUpdate }: MemoChildrenProps) => {
  return () => {
    if (!shouldUpdate) return null;
    return <slot></slot>;
  };
});
