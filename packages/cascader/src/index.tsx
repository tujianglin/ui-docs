import InternalCascader from './Cascader';
import Panel from './Panel';

export type { BaseOptionType, CascaderProps, CascaderRef, DefaultOptionType, FieldNames, SearchConfig } from './Cascader';
export { Panel };

type CompundedComponent = typeof InternalCascader & {
  Panel: typeof Panel;
};

const Cascader = InternalCascader as CompundedComponent;
Cascader.Panel = Panel;

export default Cascader;
