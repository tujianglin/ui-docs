import { createVNode, isVNode, type VNode } from 'vue';
import toArray from '../../../util/src/Children/toArray';
export function parseChildren(children: VNode | undefined, keyPath: string[]) {
  return toArray(children).map((child, index) => {
    if (isVNode(child)) {
      const { key } = child;
      let eventKey = (child.props as any)?.eventKey ?? key;

      const emptyKey = eventKey === null || eventKey === undefined;

      if (emptyKey) {
        eventKey = `tmp_key-${[...keyPath, index].join('-')}`;
      }

      const cloneProps = { key: eventKey, eventKey } as any;

      if (process.env.NODE_ENV !== 'production' && emptyKey) {
        cloneProps.warnKey = true;
      }

      return createVNode(child, cloneProps);
    }

    return child;
  });
}
