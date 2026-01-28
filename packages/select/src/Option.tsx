/* istanbul ignore file */
import type { DefaultOptionType } from './Select';

export interface OptionProps extends Omit<DefaultOptionType, 'label'> {
  /** Save for customize data */
  [prop: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface OptionFC extends OptionProps {
  /** Legacy for check if is a Option Group */
  isSelectOption: boolean;
}

/** This is a placeholder, not real render in dom */
const Option = (_props: OptionProps) => null;

(Option as any).isSelectOption = true;

export default Option;
