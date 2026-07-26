import { ConnectStateStore } from '../state/connect-state.store';
import { ConnectTransportErrorMapper } from '../transport/connect-transport-error.mapper';
import { ConnectCommandService } from './connect-command.service';

describe('ConnectCommandService delivery recovery', () => {
    it('DeliveryUnconfirmed_RequestsSnapshot_DoesNotRetry_AndClearsPending', async () => {
        const store = new ConnectStateStore();
        const hub = {
            isConnected: true,
            connect: vi.fn().mockResolvedValue(undefined),
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
            isConnected: true,
            connect: vi.fn().mockResolvedValue(undefined),
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

    it('DisconnectedCommand_RestoresSessionBeforeInvocation', async () => {
        const store = new ConnectStateStore();
        const hub = {
            isConnected: false,
            connect: vi.fn().mockImplementation(async () => {
                hub.isConnected = true;
            }),
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

        expect(hub.connect).toHaveBeenCalledOnce();
        expect(hub.connect.mock.invocationCallOrder[0]).toBeLessThan(
            hub.invoke.mock.invocationCallOrder[0],
        );
    });
});

async function expectPending(store: ConnectStateStore, expected: string[]): Promise<void> {
    let pending: string[] = [];
    store.pendingCommandIds$.subscribe((value) => (pending = [...value]));
    expect(pending).toEqual(expected);
}
