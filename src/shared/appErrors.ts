export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNSUPPORTED_FORMAT"
  | "UNSUPPORTED_TARGET"
  | "SCAN_FAILED"
  | "AI_NOT_CONFIGURED"
  | "AI_PROVIDER_ERROR"
  | "PDF_EXPORT_FAILED"
  | "DATABASE_ERROR"
  | "BACKUP_INVALID"
  | "PERMISSION_DENIED"
  | "OPERATION_CANCELLED"
  | "UNKNOWN_ERROR";

export type ValidationIssue = {
  field: string;
  message: string;
};

export type AppErrorPayload = {
  error: true;
  code: AppErrorCode;
  message: string;
  details?: Record<string, unknown>;
  suggested_action?: string;
  operation_id: string;
};

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: AppErrorPayload };

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly details?: Record<string, unknown>;
  readonly suggestedAction?: string;

  constructor(code: AppErrorCode, message: string, options: { details?: Record<string, unknown>; suggestedAction?: string } = {}) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = options.details;
    this.suggestedAction = options.suggestedAction;
  }
}

export function createOperationId(prefix = "op"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function appError(
  code: AppErrorCode,
  message: string,
  options: { details?: Record<string, unknown>; suggestedAction?: string } = {}
): AppError {
  return new AppError(code, message, options);
}

export function validationError(issues: ValidationIssue[], message = "Please check the highlighted fields and try again."): AppError {
  return new AppError("VALIDATION_ERROR", message, {
    details: { issues },
    suggestedAction: "Fix the validation messages shown in the form, then retry the action."
  });
}

export function toAppErrorPayload(error: unknown, operationId = createOperationId()): AppErrorPayload {
  if (isAppErrorPayload(error)) {
    return { ...error, operation_id: error.operation_id || operationId };
  }

  if (error instanceof AppError) {
    return {
      error: true,
      code: error.code,
      message: error.message,
      details: error.details,
      suggested_action: error.suggestedAction,
      operation_id: operationId
    };
  }

  const message = error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";
  return {
    error: true,
    code: "UNKNOWN_ERROR",
    message,
    suggested_action: "Try the action again. If it continues, check Diagnostics for local logs.",
    operation_id: operationId
  };
}

export function isAppErrorPayload(value: unknown): value is AppErrorPayload {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as AppErrorPayload).error === true &&
      typeof (value as AppErrorPayload).code === "string" &&
      typeof (value as AppErrorPayload).message === "string"
  );
}

export function isIpcResult<T>(value: unknown): value is IpcResult<T> {
  return Boolean(value && typeof value === "object" && "ok" in value);
}
