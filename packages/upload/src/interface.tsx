import type { CSSProperties } from 'vue';
import type { InputHTMLAttributes, KeyboardEvent, MouseEvent } from 'vue-jsx-vapor';

export type BeforeUploadFileType = File | Blob | boolean | string;

export type Action = string | ((file: RcFile) => string | PromiseLike<string>);

export type AcceptConfig = {
  format: string;
  filter?: 'native' | ((file: RcFile) => boolean);
};

export interface UploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onError' | 'onProgress' | 'accept'> {
  name?: string;
  style?: CSSProperties;
  class?: string;
  disabled?: boolean;
  component?: any;
  action?: Action;
  method?: UploadRequestMethod;
  directory?: boolean;
  data?: Record<string, unknown> | ((file: RcFile | string | Blob) => Record<string, unknown>);
  headers?: UploadRequestHeader;
  accept?: string | AcceptConfig;
  multiple?: boolean;
  onBatchStart?: (fileList: { file: RcFile; parsedFile: Exclude<BeforeUploadFileType, boolean> }[]) => void;
  onStart?: (file: RcFile) => void;
  onError?: (error: Error, ret: Record<string, unknown>, file: RcFile) => void;
  onSuccess?: (response: Record<string, unknown>, file: RcFile, xhr: XMLHttpRequest) => void;
  onProgress?: (event, file: RcFile) => void;
  beforeUpload?: (file: RcFile, FileList: RcFile[]) => BeforeUploadFileType | Promise<void | BeforeUploadFileType> | void;
  customRequest?: CustomUploadRequestOption;
  withCredentials?: boolean;
  openFileDialogOnClick?: boolean;
  prefixCls?: string;
  id?: string;
  onMouseEnter?: (e: MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: MouseEvent<HTMLDivElement>) => void;
  onClick?: (e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => void;
  classNames?: {
    input?: string;
  };
  styles?: {
    input?: CSSProperties;
  };
  hasControlInside?: boolean;
  pastable?: boolean;
}

export interface UploadProgressEvent extends Partial<ProgressEvent> {
  percent?: number;
}

export type UploadRequestMethod = 'POST' | 'PUT' | 'PATCH' | 'post' | 'put' | 'patch';

export type UploadRequestHeader = Record<string, string>;

export type UploadRequestFile = Exclude<BeforeUploadFileType, File | boolean> | RcFile;

export interface UploadRequestError extends Error {
  status?: number;
  method?: UploadRequestMethod;
  url?: string;
}

export interface UploadRequestOption<T = any> {
  onProgress?: (event: UploadProgressEvent, file?: UploadRequestFile) => void;
  onError?: (event: UploadRequestError | ProgressEvent, body?: T) => void;
  onSuccess?: (body: T, fileOrXhr?: UploadRequestFile | XMLHttpRequest) => void;
  data?: Record<string, unknown>;
  filename?: string;
  file: UploadRequestFile;
  withCredentials?: boolean;
  action: string;
  headers?: UploadRequestHeader;
  method: UploadRequestMethod;
}

export type CustomUploadRequestOption = (
  option: UploadRequestOption,
  info: { defaultRequest: (option: UploadRequestOption) => { abort: () => void } | void },
) => void | { abort: () => void };
export interface RcFile extends File {
  uid: string;
}
