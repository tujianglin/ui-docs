import toArray from '@vc-com/util/lib/Children/toArray';
import { isVNode, type VNode } from 'vue';
import type { BaseOptionType, DefaultOptionType } from '../Select';

function convertNodeToOption<OptionType extends BaseOptionType = DefaultOptionType>(node: VNode): OptionType {
  const {
    key,
    props: { value, ...restProps },
    children,
  } = node;

  return { key, value: value !== undefined ? value : key, children, ...restProps } as unknown as OptionType;
}

export function convertChildrenToData<OptionType extends BaseOptionType = DefaultOptionType>(
  nodes: VNode[],
  optionOnly: boolean = false,
): OptionType[] {
  return toArray(nodes)
    .map((node: VNode, index: number): OptionType | null => {
      if (!isVNode(node) || !node.type) {
        return null;
      }

      const {
        type: { isSelectOptGroup },
        key,
        props: { children, ...restProps },
      } = node as VNode & { type: { isSelectOptGroup?: boolean } };

      if (optionOnly || !isSelectOptGroup) {
        return convertNodeToOption(node);
      }

      return {
        key: `__RC_SELECT_GRP__${key === null ? index : String(key)}__`,
        label: key,
        ...restProps,
        options: convertChildrenToData(children),
      } as unknown as OptionType;
    })
    .filter((data) => data);
}
