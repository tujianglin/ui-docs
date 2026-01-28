/* istanbul ignore file */
import type { DefaultOptionType } from './Select';

export interface OptGroupProps extends Omit<DefaultOptionType, 'options'> {}

export interface OptionGroupFC extends OptGroupProps {
  /** Legacy for check if is a Option Group */
  isSelectOptGroup: boolean;
}

/** This is a placeholder, not real render in dom */
const OptGroup = (_props: OptGroupProps) => null;

(OptGroup as any).isSelectOptGroup = true;

export default OptGroup;
