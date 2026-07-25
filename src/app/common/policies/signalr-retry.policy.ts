import { IRetryPolicy, RetryContext } from '@microsoft/signalr';

export class SignalRRetryPolicy implements IRetryPolicy {
    constructor(private readonly random: () => number = Math.random) {}

    nextRetryDelayInMilliseconds(retryContext: RetryContext): number | null {
        if (this.isAuthError(retryContext.retryReason)) {
            return null;
        }

        const ranges: ReadonlyArray<readonly [number, number]> = [
            [0, 2_000],
            [2_000, 5_000],
            [5_000, 10_000],
            [10_000, 30_000],
        ];
        const [minimum, maximum] =
            ranges[Math.min(retryContext.previousRetryCount, ranges.length - 1)];
        return Math.round(minimum + this.random() * (maximum - minimum));
    }

    private isAuthError(error: Error): boolean {
        return error?.message?.includes('401') || error?.message?.includes('403');
    }
}
