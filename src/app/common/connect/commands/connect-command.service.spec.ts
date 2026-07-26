import { ConnectStateStore } from '../state/connect-state.store';
import { ConnectTransportErrorMapper } from '../transport/connect-transport-error.mapper';
import { ConnectCommandService } from './connect-command.service';

describe('ConnectCommandService delivery recovery', () => {
    it('DeliveryUnconfirmed_RequestsSnapshot_DoesNotRetry_AndClearsPending', async () => {
        const store = new ConnectStateStore();
        const hub = {
            waitUntilReady: vi.fn().mockResolvedValue(undefined),
            invoke: vi.fn().mockRejectedValue(new Error('connect_delivery_unconfirmed')),
            recoverFromUnconfirmedDelivery: vi.fn().mockResolvedValue(undefined),
        };
        const service = new ConnectCommandService(
            hub as never,
            { create: () => 'command-1' } as never,
            store,
            new ConnectTransportErrorMapper(),
        );

        const ack = await service.play();

        expect(hub.invoke).toHaveBeenCalledOnce();
        expect(hub.invoke).toHaveBeenCalledWith('Play', { commandId: 'command-1' });
        expect(hub.recoverFromUnconfirmedDelivery).toHaveBeenCalledWith('command-1');
        expect(ack.status).toBe('Duplicate');
        await expectPending(store, []);
    });

    it('DeliveryUnconfirmed_SetsOutOfSyncWhenSnapshotFails', async () => {
        const store = new ConnectStateStore();
        const hub = {
            waitUntilReady: vi.fn().mockResolvedValue(undefined),
            invoke: vi.fn().mockRejectedValue(new Error('connect_delivery_unconfirmed')),
            recoverFromUnconfirmedDelivery: vi.fn().mockImplementation(async () => {
                store.setSyncStatus('OutOfSync');
                throw new Error('connect_snapshot_recovery_failed');
            }),
        };
        const service = new ConnectCommandService(
            hub as never,
            { create: () => 'command-1' } as never,
            store,
            new ConnectTransportErrorMapper(),
        );

        await expect(service.play()).rejects.toThrow('connect_snapshot_recovery_failed');

        await expectPending(store, []);
        let status = '';
        store.syncStatus$.subscribe((value) => (status = value));
        expect(status).toBe('OutOfSync');
        expect(hub.invoke).toHaveBeenCalledOnce();
    });

    it('Command_WaitsForReadyBeforeInvocation', async () => {
        const store = new ConnectStateStore();
        const hub = {
            waitUntilReady: vi.fn().mockResolvedValue(undefined),
            invoke: vi.fn().mockResolvedValue({
                commandId: 'command-1',
                status: 'Applied',
                errorCode: null,
                outcome: null,
            }),
            refreshSnapshot: vi.fn(),
        };
        const service = new ConnectCommandService(
            hub as never,
            { create: () => 'command-1' } as never,
            store,
            new ConnectTransportErrorMapper(),
        );

        await service.play();

        expect(hub.waitUntilReady).toHaveBeenCalledOnce();
        expect(hub.waitUntilReady.mock.invocationCallOrder[0]).toBeLessThan(
            hub.invoke.mock.invocationCallOrder[0],
        );
    });

    it('ReadinessFailure_DoesNotPoisonTheNextCommand', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const store = new ConnectStateStore();
        const hub = {
            waitUntilReady: vi
                .fn()
                .mockRejectedValueOnce(new Error('connect_server_unavailable'))
                .mockResolvedValueOnce(undefined),
            invoke: vi.fn().mockResolvedValue({
                commandId: 'command-2',
                status: 'Applied',
                errorCode: null,
                outcome: null,
            }),
            diagnosticState: {
                hubState: 'Connected',
                lifecycleState: 'unavailable',
                isReady: false,
            },
        };
        let commandNumber = 0;
        const service = new ConnectCommandService(
            hub as never,
            { create: () => `command-${++commandNumber}` } as never,
            store,
            new ConnectTransportErrorMapper(),
        );

        await expect(service.play()).rejects.toThrow('connect_server_unavailable');
        await expect(service.play()).resolves.toMatchObject({ status: 'Applied' });

        expect(hub.invoke).toHaveBeenCalledOnce();
        await expectPending(store, []);
    });

    it('PauseNoChanges_DoesNotBlockSubsequentStartPlaybackContext', async () => {
        const store = new ConnectStateStore();
        const hub = {
            waitUntilReady: vi.fn().mockResolvedValue(undefined),
            invoke: vi
                .fn()
                .mockResolvedValueOnce({
                    commandId: 'command-1',
                    status: 'NoChanges',
                    errorCode: null,
                    outcome: null,
                })
                .mockResolvedValueOnce({
                    commandId: 'command-2',
                    status: 'Applied',
                    errorCode: null,
                    outcome: null,
                }),
        };
        let commandNumber = 0;
        const service = new ConnectCommandService(
            hub as never,
            { create: () => `command-${++commandNumber}` } as never,
            store,
            new ConnectTransportErrorMapper(),
        );

        await expect(service.pause()).resolves.toMatchObject({ status: 'NoChanges' });
        await expect(
            service.startPlaybackContext(
                'album-2',
                'Album',
                [{ queueItemId: 'queue-1', trackId: 'track-1' }],
            ),
        ).resolves.toMatchObject({ status: 'Applied' });

        expect(hub.waitUntilReady).toHaveBeenCalledTimes(2);
        expect(hub.invoke).toHaveBeenNthCalledWith(1, 'Pause', {
            commandId: 'command-1',
        });
        expect(hub.invoke).toHaveBeenNthCalledWith(2, 'StartPlaybackContext', {
            commandId: 'command-2',
            sourceId: 'album-2',
            sourceType: 'Album',
            items: [{ queueItemId: 'queue-1', trackId: 'track-1' }],
            startIndex: null,
        });
        await expectPending(store, []);
    });

    it('InvocationFailure_PreservesOriginalSignalRErrorAsCause', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const original = new Error(
            "An unexpected error occurred invoking 'StartPlaybackContext' on the server. HubException: connect_internal_error",
        );
        const store = new ConnectStateStore();
        const hub = {
            waitUntilReady: vi.fn().mockResolvedValue(undefined),
            invoke: vi.fn().mockRejectedValue(original),
            diagnosticState: { hubState: 'Connected' },
        };
        const service = new ConnectCommandService(
            hub as never,
            { create: () => 'command-1' } as never,
            store,
            new ConnectTransportErrorMapper(),
        );

        let thrown: Error | undefined;
        try {
            await service.startPlaybackContext(
                'album-2',
                'Album',
                [{ queueItemId: 'queue-1', trackId: 'track-1' }],
            );
        } catch (error: unknown) {
            thrown = error as Error;
        }

        expect(thrown?.message).toBe('connect_server_internal_error');
        expect(thrown?.cause).toBe(original);
        expect(console.error).toHaveBeenCalledWith(
            '[Connect v2] command invocation failed',
            expect.objectContaining({
                originalErrorType: 'Error',
                originalErrorMessage: original.message,
                transportErrorKind: 'ServerInternalError',
            }),
        );
        await expectPending(store, []);
    });
});

async function expectPending(store: ConnectStateStore, expected: string[]): Promise<void> {
    let pending: string[] = [];
    store.pendingCommandIds$.subscribe((value) => (pending = [...value]));
    expect(pending).toEqual(expected);
}
