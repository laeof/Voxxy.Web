import { HubConnectionState } from '@microsoft/signalr';
import { ConnectStateStore } from '../state/connect-state.store';
import { ConnectHubService } from './connect-hub.service';
import { ConnectTransportErrorMapper } from './connect-transport-error.mapper';

describe('ConnectHubService transport failure and reconnect', () => {
    it('InitialStartFailure_DoesNotStartHeartbeat_OrRegisterConnectionBeforeRetry', async () => {
        vi.useFakeTimers();
        const connection = fakeConnection();
        connection.start.mockRejectedValue(new Error('WebSocket is not supported'));
        const { service, store } = createService(connection);

        await expect(service.connect()).rejects.toThrow('connect_websocket_unavailable');

        expect(connection.invoke).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(1);
        let errorCode: string | null = null;
        store.transportErrorCode$.subscribe((value) => (errorCode = value));
        expect(errorCode).toBe('connect_websocket_unavailable');
        vi.useRealTimers();
    });

    it('InitialStartFailure_RetriesAndRestoresAuthoritativeSession', async () => {
        vi.useFakeTimers();
        const connection = fakeConnection();
        connection.start
            .mockRejectedValueOnce(new Error('Failed to start the connection'))
            .mockImplementationOnce(async () => {
                connection.state = HubConnectionState.Connected;
                connection.connectionId = 'recovered-connection';
            });
        connection.invoke.mockImplementation((method: string) => {
            if (method === 'GetSnapshot') return Promise.resolve(snapshot());
            if (method === 'RegisterConnection') {
                return Promise.resolve({
                    commandId: 'command',
                    status: 'Applied',
                    errorCode: null,
                    outcome: outcome('recovered-connection'),
                });
            }
            return Promise.reject(new Error('unexpected invocation'));
        });
        const { service } = createService(connection);

        await expect(service.connect()).rejects.toThrow('connect_websocket_unavailable');
        await vi.advanceTimersByTimeAsync(2_000);
        await vi.waitFor(() => expect(connection.start).toHaveBeenCalledTimes(2));
        await vi.waitFor(() =>
            expect(connection.invoke).toHaveBeenCalledWith(
                'RegisterConnection',
                expect.objectContaining({ deviceId: 'stable-device' }),
            ),
        );

        expect(
            connection.invoke.mock.calls.filter(([method]) => method === 'GetSnapshot'),
        ).toHaveLength(2);
        vi.useRealTimers();
    });

    it('Reconnect_StopsHeartbeat_AndPausesEngineWithoutPauseCommand', () => {
        const connection = fakeConnection();
        const playerState = { pause: vi.fn() };
        createService(connection, playerState);

        connection.reconnecting?.();

        expect(playerState.pause).toHaveBeenCalledOnce();
        expect(connection.invoke).not.toHaveBeenCalledWith('Pause', expect.anything());
    });

    it('Reconnect_UsesSameDeviceId_AndWaitsForAuthoritativeOwnershipBeforePlaying', async () => {
        vi.useFakeTimers();
        const connection = fakeConnection();
        connection.state = HubConnectionState.Connected;
        connection.connectionId = 'new-connection';
        connection.invoke.mockImplementation((method: string) => {
            if (method === 'GetSnapshot') return Promise.resolve(snapshot());
            if (method === 'RegisterConnection') {
                return Promise.resolve({
                    commandId: 'command',
                    status: 'Applied',
                    errorCode: null,
                    outcome: outcome('new-connection'),
                });
            }
            return Promise.reject(new Error('unexpected invocation'));
        });
        const playerState = { pause: vi.fn(), play: vi.fn() };
        createService(connection, playerState);

        connection.reconnected?.();
        await vi.waitFor(() =>
            expect(connection.invoke).toHaveBeenCalledWith(
                'RegisterConnection',
                expect.objectContaining({ deviceId: 'stable-device' }),
            ),
        );

        expect(playerState.play).not.toHaveBeenCalled();
        expect(
            connection.invoke.mock.calls.filter(([method]) => method === 'GetSnapshot'),
        ).toHaveLength(2);
        vi.useRealTimers();
    });

    it('Offline_PausesEngineWithoutPauseCommand', () => {
        const connection = fakeConnection();
        const playerState = { pause: vi.fn() };
        createService(connection, playerState);

        globalThis.dispatchEvent(new Event('offline'));

        expect(playerState.pause).toHaveBeenCalled();
        expect(connection.invoke).not.toHaveBeenCalledWith('Pause', expect.anything());
    });

    it('SuspendedTab_ReregistersAfterLeaseExpiry', async () => {
        vi.useFakeTimers();
        const connection = fakeConnection();
        connection.state = HubConnectionState.Connected;
        connection.invoke.mockImplementation((method: string) => {
            if (method === 'RegisterConnection') {
                return Promise.resolve({
                    commandId: 'command',
                    status: 'Applied',
                    errorCode: null,
                    outcome: outcome('connection'),
                });
            }
            if (method === 'RefreshConnectionLease') {
                return Promise.resolve({
                    commandId: null,
                    status: 'ConnectionNotFound',
                    errorCode: null,
                    outcome: null,
                });
            }
            return Promise.reject(new Error('unexpected invocation'));
        });
        const { service } = createService(connection);
        await service.registerConnection();

        await vi.advanceTimersByTimeAsync(15_000);

        expect(
            connection.invoke.mock.calls.filter(([method]) => method === 'RegisterConnection'),
        ).toHaveLength(2);
        vi.useRealTimers();
    });

    it('IdempotentRegistration_StartsHeartbeatAndAllowsSessionRestore', async () => {
        vi.useFakeTimers();
        const connection = fakeConnection();
        connection.state = HubConnectionState.Connected;
        connection.invoke.mockResolvedValue({
            commandId: 'command',
            status: 'NoChanges',
            errorCode: null,
            outcome: outcome('connection'),
        });
        const { service } = createService(connection);

        await expect(service.registerConnection()).resolves.toBeUndefined();
        expect(vi.getTimerCount()).toBe(1);
        vi.useRealTimers();
    });
});

function createService(
    connection: ReturnType<typeof fakeConnection>,
    playerState = { pause: vi.fn() },
) {
    const store = new ConnectStateStore();
    const applier = { setSnapshotRecovery: vi.fn() };
    const telemetry = { emit: vi.fn() };
    const service = new ConnectHubService(
        store,
        applier as never,
        { deviceId: 'stable-device', deviceName: 'Browser' } as never,
        { create: () => 'command' } as never,
        { create: () => connection } as never,
        new ConnectTransportErrorMapper(),
        telemetry as never,
        playerState as never,
        { heartbeatDelay: () => 15_000 } as never,
    );
    return { service, store };
}

function fakeConnection() {
    const connection = {
        state: HubConnectionState.Disconnected,
        connectionId: null as string | null,
        start: vi.fn(),
        stop: vi.fn(),
        invoke: vi.fn(),
        on: vi.fn(),
        onreconnecting: vi.fn((callback: () => void) => {
            connection.reconnecting = callback;
        }),
        onreconnected: vi.fn((callback: () => void) => {
            connection.reconnected = callback;
        }),
        onclose: vi.fn((callback: () => void) => {
            connection.closed = callback;
        }),
        reconnecting: undefined as (() => void) | undefined,
        reconnected: undefined as (() => void) | undefined,
        closed: undefined as (() => void) | undefined,
    };
    return connection;
}

function snapshot() {
    return {
        status: 'Applied',
        player: {
            isPlaying: true,
            positionMs: 0,
            positionUpdatedAt: '2026-01-01T00:00:00Z',
            volumePercent: 50,
            version: 1,
        },
        queue: {
            items: [],
            currentQueueItemId: null,
            repeatMode: 'None',
            isShuffled: false,
            version: 1,
        },
        presence: {
            devices: [],
            activeDeviceId: 'stable-device',
            audioOwnerConnectionId: null,
            version: 1,
        },
        serverTime: '2026-01-01T00:00:00Z',
        errorCode: null,
    };
}

function outcome(connectionId: string) {
    return {
        deviceId: 'stable-device',
        connectionId,
        queueItemId: null,
        playerVersion: null,
        queueVersion: null,
        presenceVersion: 1,
        removedConnectionCount: null,
    };
}
