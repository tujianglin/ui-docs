import type { BaseSelectProps, BaseSelectPropsWithoutPrivate, BaseSelectRef } from './BaseSelect';
import BaseSelect from './BaseSelect';
import { useBaseSelectContextInject } from './hooks/useBaseProps';
import type { SelectProps } from './Select';
import Select from './Select';

export { BaseSelect, useBaseSelectContextInject };
export type { BaseSelectProps, BaseSelectPropsWithoutPrivate, BaseSelectRef, SelectProps };

export default Select;
