import { IRetryPolicy, RetryContext } from '@microsoft/signalr';

export class SignalRRetryPolicy implements IRetryPolicy {
    nextRetryDelayInMilliseconds(retryContext: RetryContext): number | null {
        if (this.isAuthError(retryContext.retryReason)) {
            return null;
        }

        const delays = [0, 2_000, 5_000, 10_000, 15_000];

        return delays[retryContext.previousRetryCount] ?? 15_000;
    }

    private isAuthError(error: Error): boolean {
        return error?.message?.includes('401') || error?.message?.includes('403');
    }
}
