import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

// エラー型定義
export const ErrorType = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

interface ApiErrorResponse {
  detail?: string | { msg: string; type: string }[];
  message?: string;
}

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  originalError?: unknown;
}

// エラーメッセージマッピング
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
  [ErrorType.VALIDATION]: '入力内容に誤りがあります。',
  [ErrorType.AUTHENTICATION]: '認証に失敗しました。再度ログインしてください。',
  [ErrorType.AUTHORIZATION]: 'この操作を実行する権限がありません。',
  [ErrorType.NOT_FOUND]: '指定されたリソースが見つかりませんでした。',
  [ErrorType.SERVER]: 'サーバーエラーが発生しました。しばらくしてから再度お試しください。',
  [ErrorType.UNKNOWN]: '予期しないエラーが発生しました。',
};

const STATUS_TO_ERROR_TYPE: Record<number, ErrorType> = {
  400: ErrorType.VALIDATION,
  401: ErrorType.AUTHENTICATION,
  403: ErrorType.AUTHORIZATION,
  404: ErrorType.NOT_FOUND,
  422: ErrorType.VALIDATION,
  500: ErrorType.SERVER,
  502: ErrorType.SERVER,
  503: ErrorType.SERVER,
};

// エラー解析関数
export function parseError(error: unknown): ErrorInfo {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    if (!axiosError.response) {
      return {
        type: ErrorType.NETWORK,
        message: ERROR_MESSAGES[ErrorType.NETWORK],
        originalError: error,
      };
    }

    const status = axiosError.response.status;
    const errorType = STATUS_TO_ERROR_TYPE[status] || ErrorType.UNKNOWN;
    let message = ERROR_MESSAGES[errorType];

    const responseData = axiosError.response.data;
    if (responseData) {
      if (typeof responseData.detail === 'string') {
        message = responseData.detail;
      } else if (Array.isArray(responseData.detail)) {
        const validationErrors = responseData.detail.map((err) => err.msg).join(', ');
        message = `${ERROR_MESSAGES[ErrorType.VALIDATION]}: ${validationErrors}`;
      } else if (responseData.message) {
        message = responseData.message;
      }
    }

    return { type: errorType, message, originalError: error };
  }

  if (typeof error === 'string') {
    return { type: ErrorType.UNKNOWN, message: error, originalError: error };
  }

  if (error instanceof Error) {
    return {
      type: ErrorType.UNKNOWN,
      message: error.message || ERROR_MESSAGES[ErrorType.UNKNOWN],
      originalError: error,
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    message: ERROR_MESSAGES[ErrorType.UNKNOWN],
    originalError: error,
  };
}

function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

// 認証エラー（401/403）かどうかを判定
export function isAuthError(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return false;
  }
  const status = error.response?.status;
  return status === 401 || status === 403;
}

// 接続エラー（ネットワークエラーまたはサーバーエラー5xx）かどうかを判定
export function isConnectionError(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return false;
  }
  // レスポンスがない = ネットワークエラー（サーバーに到達できない）
  if (!error.response) {
    return true;
  }
  // 5xxエラー = サーバーエラー（DB接続エラーなど）
  const status = error.response.status;
  return status >= 500 && status < 600;
}

// エラートーストID（重複防止・dismiss用）
const AUTH_ERROR_TOAST_ID = 'auth-error';
const CONNECTION_ERROR_TOAST_ID = 'connection-error';
const LOGIN_ERROR_TOAST_ID = 'login-error';
const GENERAL_ERROR_TOAST_ID = 'general-error';
const VALIDATION_ERROR_TOAST_ID = 'validation-error';

// エラートーストをすべてクリア（クリック時などに呼び出し）
export function dismissErrorToasts(): void {
  toast.dismiss(AUTH_ERROR_TOAST_ID);
  toast.dismiss(CONNECTION_ERROR_TOAST_ID);
  toast.dismiss(LOGIN_ERROR_TOAST_ID);
  toast.dismiss(GENERAL_ERROR_TOAST_ID);
  toast.dismiss(VALIDATION_ERROR_TOAST_ID);
}

// 認証エラー用トースト表示（interceptorから呼び出し）
export function showAuthErrorToast(): void {
  toast.error(ERROR_MESSAGES[ErrorType.AUTHENTICATION], {
    id: AUTH_ERROR_TOAST_ID,
    duration: Infinity,
    position: 'top-center',
    style: {
      background: '#FEE2E2',
      border: '1px solid #FCA5A5',
      padding: '16px',
      color: '#991B1B',
    },
    iconTheme: {
      primary: '#DC2626',
      secondary: '#FFFFFF',
    },
  });
}

// 接続エラー用トースト表示（interceptorから呼び出し）
export function showConnectionErrorToast(): void {
  toast.error('データへアクセスできませんでした。システム管理者にご連絡ください。', {
    id: CONNECTION_ERROR_TOAST_ID,
    duration: Infinity,
    position: 'top-center',
    style: {
      background: '#FEE2E2',
      border: '1px solid #FCA5A5',
      padding: '16px',
      color: '#991B1B',
    },
    iconTheme: {
      primary: '#DC2626',
      secondary: '#FFFFFF',
    },
  });
}

// ログインエラー用トースト表示
export function showLoginErrorToast(): void {
  toast.error('ログインに失敗しました。メールアドレスとパスワードを確認してください。', {
    id: LOGIN_ERROR_TOAST_ID,
    duration: Infinity,
    position: 'top-center',
    style: {
      background: '#FEE2E2',
      border: '1px solid #FCA5A5',
      padding: '16px',
      color: '#991B1B',
    },
    iconTheme: {
      primary: '#DC2626',
      secondary: '#FFFFFF',
    },
  });
}

// トースト通知関数
export function showErrorToast(error: unknown, customMessage?: string): void {
  // 認証エラー・接続エラーはinterceptorで一元的に処理するためスキップ
  if (isAuthError(error)) {
    return;
  }

  if (isConnectionError(error)) {
    return;
  }

  const errorInfo = parseError(error);
  const message = customMessage || errorInfo.message;

  toast.error(message, {
    id: GENERAL_ERROR_TOAST_ID,
    duration: Infinity,
    position: 'top-center',
    style: {
      background: '#FEE2E2',
      border: '1px solid #FCA5A5',
      padding: '16px',
      color: '#991B1B',
    },
    iconTheme: {
      primary: '#DC2626',
      secondary: '#FFFFFF',
    },
  });
}

export function showSuccessToast(message: string): void {
  toast.success(message, {
    duration: 3000,
    position: 'top-center',
    style: {
      background: '#D1FAE5',
      border: '1px solid #6EE7B7',
      padding: '16px',
      color: '#065F46',
    },
    iconTheme: {
      primary: '#10B981',
      secondary: '#FFFFFF',
    },
  });
}

export function showValidationError(message: string): void {
  toast.error(message, {
    id: VALIDATION_ERROR_TOAST_ID,
    duration: Infinity,
    position: 'top-center',
    style: {
      background: '#FEF3C7',
      border: '1px solid #FCD34D',
      padding: '16px',
      color: '#92400E',
    },
    iconTheme: {
      primary: '#F59E0B',
      secondary: '#FFFFFF',
    },
  });
}
