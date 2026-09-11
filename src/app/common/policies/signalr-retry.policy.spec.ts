import { SignalRRetryPolicy } from './signalr-retry.policy';

describe('SignalRRetryPolicy', () => {
    it('ReconnectPolicy_UsesBoundedDelays', () => {
        const policy = new SignalRRetryPolicy(() => 1);
        const reason = new Error('network');

        expect(
            [0, 1, 2, 3, 20].map((previousRetryCount) =>
                policy.nextRetryDelayInMilliseconds({
                    elapsedMilliseconds: 0,
                    previousRetryCount,
                    retryReason: reason,
                }),
            ),
        ).toEqual([2_000, 5_000, 10_000, 30_000, 30_000]);
    });
});
