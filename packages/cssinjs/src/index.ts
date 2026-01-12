import { extractStyle } from './extractStyle';
import { getComputedToken, useCacheToken } from './hooks/useCacheToken';
import { useCSSVarRegister } from './hooks/useCSSVarRegister';
import type { CSSInterpolation, CSSObject } from './hooks/useStyleRegister';
import { useStyleRegister } from './hooks/useStyleRegister';
import Keyframes from './Keyframes';
import type { Linter } from './linters';
import { legacyNotSelectorLinter, logicalPropertiesLinter, NaNLinter, parentSelectorLinter } from './linters';
import type { StyleProviderProps } from './StyleContext';
import { createCache, StyleProvider, useStyleContext } from './StyleContext';
import type { AbstractCalculator, DerivativeFunc, TokenType } from './theme';
import { createTheme, genCalc, Theme } from './theme';
import { transform as autoPrefixTransformer } from './transformers/autoPrefix';
import type { Transformer } from './transformers/interface';
import legacyLogicalPropertiesTransformer from './transformers/legacyLogicalProperties';
import px2remTransformer from './transformers/px2rem';
import { supportLogicProps, supportWhere, unit } from './util';
import { token2CSSVar } from './util/css-variables';

export {
  // Transformer
  autoPrefixTransformer,
  createCache,
  createTheme,
  extractStyle,
  genCalc,
  getComputedToken,
  Keyframes,
  legacyLogicalPropertiesTransformer,
  legacyNotSelectorLinter,
  // Linters
  logicalPropertiesLinter,
  NaNLinter,
  parentSelectorLinter,
  px2remTransformer,
  StyleProvider,
  Theme,
  // util
  token2CSSVar,
  unit,
  useCacheToken,
  useCSSVarRegister,
  useStyleContext,
  useStyleRegister,
};
export type {
  AbstractCalculator,
  CSSInterpolation,
  CSSObject,
  DerivativeFunc,
  Linter,
  StyleProviderProps,
  TokenType,
  Transformer,
};

export const _experimental = {
  supportModernCSS: () => supportWhere() && supportLogicProps(),
};
