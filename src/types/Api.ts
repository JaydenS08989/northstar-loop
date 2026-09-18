export type ApiError = { error: { code: string; message: string } };
export type ApiSuccess<T> = { data: T };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
