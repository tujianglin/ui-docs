import type { VNodeChild } from 'vue';

export type VueNode = VNodeChild | JSX.Element;

export type Key = string | number;

export type RenderNode<T = any> = ((props?: T) => VueNode) | VueNode;
