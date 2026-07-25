import { HubConnectionState } from '@microsoft/signalr';
import { ConnectStateStore } from '../state/connect-state.store';
import { ConnectHubService } from './connect-hub.service';
import { ConnectTransportErrorMapper } from './connect-transport-error.mapper';

describe('ConnectHubService transport failure and reconnect', () => {
    it('WebSocketUnavailable_DoesNotStartHeartbeat_OrRegisterConnection', async () => {
        vi.useFakeTimers();
        const connection = fakeConnection();
        connection.start.mockRejectedValue(new Error('WebSocket is not supported'));
        const { service, store } = createService(connection);

        await expect(service.connect()).rejects.toThrow('connect_websocket_unavailable');

        expect(connection.invoke).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
        let errorCode: string | null = null;
        store.transportErrorCode$.subscribe((value) => (errorCode = value));
        expect(errorCode).toBe('connect_websocket_unavailable');
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
                    outcome: null,
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
