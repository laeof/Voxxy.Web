export interface Result<T> {
    success: boolean;
    value?: T;
    error?: string;
}