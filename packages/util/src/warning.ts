/* eslint-disable no-console */
let warned: Record<string, boolean> = {};

export type preMessageFn = (message: string, type: 'warning' | 'note') => string | null | undefined;

const preWarningFns: preMessageFn[] = [];

/**
 * 预处理警告消息
 *
 * @description
 * 允许你在 console.error 之前解析内容。
 * 返回 null 可阻止警告输出。
 *
 * @example
 * ```ts
 * import { preMessage } from '@/warning';
 *
 * preMessage((msg, type) => {
 *   if (type === 'warning') {
 *     return `[My App] ${msg}`;
 *   }
 *   return msg;
 * });
 * ```
 */
export const preMessage = (fn: preMessageFn) => {
  preWarningFns.push(fn);
};

/**
 * 条件警告函数
 *
 * @description
 * 当条件不满足时输出警告信息。
 *
 * @example
 * ```ts
 * import { warning } from '@/warning';
 *
 * warning(false, 'some error'); // 输出 "Warning: some error"
 * warning(true, 'some error');  // 不输出
 * warning(1 === 2, 'some error'); // 输出 "Warning: some error"
 * ```
 *
 * @param valid - 条件，为 false 时输出警告
 * @param message - 警告消息
 */
export function warning(valid: boolean, message: string) {
  if (process.env.NODE_ENV !== 'production' && !valid && console !== undefined) {
    const finalMessage = preWarningFns.reduce<string>(
      (msg, preMessageFn) => (preMessageFn(msg ?? '', 'warning') as string) ?? msg,
      message,
    );

    if (finalMessage) {
      console.error(`Warning: ${finalMessage}`);
    }
  }
}

/**
 * 输出提示信息
 * @see 类似于 {@link warning}
 */
export function note(valid: boolean, message: string) {
  if (process.env.NODE_ENV !== 'production' && !valid && console !== undefined) {
    const finalMessage = preWarningFns.reduce<string>(
      (msg, preMessageFn) => (preMessageFn(msg ?? '', 'note') as string) ?? msg,
      message,
    );

    if (finalMessage) {
      console.warn(`Note: ${finalMessage}`);
    }
  }
}

export function resetWarned() {
  warned = {};
}

export function call(method: (valid: boolean, message: string) => void, valid: boolean, message: string) {
  if (!valid && !warned[message]) {
    method(false, message);
    warned[message] = true;
  }
}

/**
 * 只警告一次
 * @see 同 {@link warning}，但相同消息只警告一次
 */
export function warningOnce(valid: boolean, message: string) {
  call(warning, valid, message);
}

/**
 * 只提示一次
 * @see 同 {@link note}，但相同消息只提示一次
 */
export function noteOnce(valid: boolean, message: string) {
  call(note, valid, message);
}
