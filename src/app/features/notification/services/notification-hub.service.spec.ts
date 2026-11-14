import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import { NotificationDto, NotificationReadEvent } from '../models/notification';
import { NotificationHubConnectionFactory } from './notification-hub-connection.factory';
import { NotificationHubService } from './notification-hub.service';
import { NotificationService } from './notification.service';

class FakeHubConnection {
    state = HubConnectionState.Disconnected;
    readonly handlers = new Map<string, (payload: unknown) => void>();
    readonly start = vi.fn(async () => {
        this.state = HubConnectionState.Connected;
    });
    readonly stop = vi.fn(async () => {
        this.state = HubConnectionState.Disconnected;
    });
    reconnecting: (() => void) | null = null;
    reconnected: (() => void) | null = null;
    closed: (() => void) | null = null;

    on(method: string, handler: (payload: unknown) => void): void {
        this.handlers.set(method, handler);
    }

    onreconnecting(handler: () => void): void {
        this.reconnecting = handler;
    }

    onreconnected(handler: () => void): void {
        this.reconnected = handler;
    }

    onclose(handler: () => void): void {
        this.closed = handler;
    }
}

const notification = (): NotificationDto => ({
    id: 'notification-1',
    type: 'FutureType',
    title: 'Title',
    description: 'Description',
    details: {},
    createdAt: '2026-11-13T10:00:00.000Z',
    readAt: null,
});

describe('NotificationHubService', () => {
    const createHarness = () => {
        const connection = new FakeHubConnection();
        const notifications = {
            synchronize: vi.fn(async () => undefined),
            applyReceived: vi.fn(),
            applyRead: vi.fn(),
            applyReadAll: vi.fn(),
            clear: vi.fn(),
        };
        const factory = {
            create: vi.fn(() => connection as unknown as HubConnection),
        };
        const service = new NotificationHubService(
            factory as unknown as NotificationHubConnectionFactory,
            notifications as unknown as NotificationService,
        );
        return { connection, notifications, service };
    };

    it('Initialize_SynchronizesBeforeAndAfterConnection', async () => {
        const { connection, notifications, service } = createHarness();

        await service.initialize();

        expect(connection.start).toHaveBeenCalledOnce();
        expect(notifications.synchronize).toHaveBeenCalledTimes(2);
        await service.disconnect();
    });

    it('RealtimeEvents_AreForwardedWithoutTypeRestrictions', async () => {
        const { connection, notifications, service } = createHarness();
        await service.initialize();
        const received = notification();
        const read: NotificationReadEvent = {
            notificationId: received.id,
            readAt: '2026-11-13T11:00:00.000Z',
        };

        connection.handlers.get('NotificationReceived')?.(received);
        connection.handlers.get('NotificationRead')?.(read);
        const readAll = {
            notificationIds: [received.id],
            readAt: read.readAt,
        };
        connection.handlers.get('NotificationsReadAll')?.(readAll);

        expect(notifications.applyReceived).toHaveBeenCalledWith(received);
        expect(notifications.applyRead).toHaveBeenCalledWith(read);
        expect(notifications.applyReadAll).toHaveBeenCalledWith(readAll);
        await service.disconnect();
    });

    it('Reconnect_RefreshesAuthoritativeHttpState', async () => {
        const { connection, notifications, service } = createHarness();
        await service.initialize();

        connection.reconnected?.();
        await vi.waitFor(() => expect(notifications.synchronize).toHaveBeenCalledTimes(3));

        await service.disconnect();
    });
});
