import { Injectable } from '@angular/core';
import {
    HubConnection,
    HubConnectionState,
} from '@microsoft/signalr';
import { environment } from '@environments/environment';
import { MediaPlayerStateService } from '@common/services/media-player-state.service';
import { CommandIdService } from '../commands/command-id.service';
import { DeviceIdentityService } from '../device/device-identity.service';
import { ConnectStateStore } from '../state/connect-state.store';
import { ConnectEventApplierService } from '../sync/connect-event-applier.service';
import {
    ConnectCommandAck,
    ConnectSnapshotResponse,
    PlayerPresenceStateChangedEvent,
    PlayerQueueStateChangedEvent,
    PlayerStateChangedEvent,
    PresenceStateChangedEvent,
    QueueStateChangedEvent,
    RegisterConnectionRequest,
} from './connect-transport.models';
import { ConnectClientTelemetry } from './connect-client-telemetry.service';
import { ConnectHubConnectionFactory } from './connect-hub-connection.factory';
import { ConnectTransportErrorMapper } from './connect-transport-error.mapper';
import { ConnectTiming } from './connect-timing.service';

const HEARTBEAT_INTERVAL_MS = 15_000;

@Injectable({ providedIn: 'root' })
export class ConnectHubService {
    private readonly connection: HubConnection;
    private connectPromise: Promise<void> | null = null;
    private heartbeatId: ReturnType<typeof setTimeout> | null = null;
    private registrationPromise: Promise<void> | null = null;
    private snapshotPromise: Promise<boolean> | null = null;

    constructor(
        private readonly store: ConnectStateStore,
        private readonly applier: ConnectEventApplierService,
        private readonly identity: DeviceIdentityService,
        private readonly commandIds: CommandIdService,
        private readonly connectionFactory: ConnectHubConnectionFactory,
        private readonly errors: ConnectTransportErrorMapper,
        private readonly telemetry: ConnectClientTelemetry,
        private readonly playerState: MediaPlayerStateService,
        private readonly timing: ConnectTiming,
    ) {
        this.connection = this.connectionFactory.create(
            `${environment.apiUrl}/hubs/connect`,
            // Authentication uses an HttpOnly JWT cookie. Keep the factory dynamic so a future
            // bearer-token provider is read at connection/reconnection time, never captured.
            () => '',
        );
        this.registerHandlers();
        this.applier.setSnapshotRecovery(() => this.refreshSnapshot());
        globalThis.addEventListener?.('offline', () => {
            this.stopHeartbeat();
            this.playerState.pause();
        });
    }

    get isConnected(): boolean {
        return this.connection.state === HubConnectionState.Connected;
    }

    get connectionId(): string | null {
        return this.connection.connectionId;
    }

    connect(): Promise<void> {
        if (this.isConnected) return Promise.resolve();
        if (this.connectPromise) return this.connectPromise;

        this.store.setTransportState('connecting');
        this.connectPromise = this.connection
            .start()
            .then(async () => {
                this.store.setTransportError(null);
                this.store.setTransportState('connected');
                this.telemetry.emit('connect_transport_connected');
                await this.restoreSession();
            })
            .catch((error: unknown) => {
                const mapped = this.errors.map(error);
                this.stopHeartbeat();
                this.store.setTransportState(
                    mapped.kind === 'WebSocketUnavailable' ? 'unavailable' : 'disconnected',
                );
                this.store.setTransportError(mapped.code);
                throw new Error(mapped.code);
            })
            .finally(() => {
                this.connectPromise = null;
            });
        return this.connectPromise;
    }

    invoke<T>(method: string, payload?: unknown): Promise<T> {
        if (!this.isConnected) return Promise.reject(new Error('connect_transport_disconnected'));
        return payload === undefined
            ? this.connection.invoke<T>(method)
            : this.connection.invoke<T>(method, payload);
    }

    async refreshSnapshot(): Promise<void> {
        await this.requestSnapshot();
    }

    async recoverFromUnconfirmedDelivery(commandId: string): Promise<void> {
        this.telemetry.emit('connect_delivery_unconfirmed');
        this.telemetry.emit('connect_snapshot_recovery_started', { reason: 'delivery_unconfirmed' });
        try {
            const applied = await this.requestSnapshot();
            if (!applied) throw new Error('connect_snapshot_recovery_failed');
            this.telemetry.emit('connect_snapshot_recovery_succeeded', {
                reason: 'delivery_unconfirmed',
            });
        } catch {
            this.store.setSyncStatus('OutOfSync');
            this.telemetry.emit('connect_snapshot_recovery_failed', {
                reason: 'delivery_unconfirmed',
            });
            throw new Error('connect_snapshot_recovery_failed');
        }
    }

    async registerConnection(): Promise<void> {
        if (this.registrationPromise) return this.registrationPromise;
        const request: RegisterConnectionRequest = {
            commandId: this.commandIds.create(),
            deviceId: this.identity.deviceId,
            deviceName: this.identity.deviceName,
        };
        this.registrationPromise = this.invoke<ConnectCommandAck>('RegisterConnection', request)
            .then((ack) => {
                if (ack.status !== 'Applied' && ack.status !== 'Duplicate') {
                    throw new Error(ack.errorCode ?? `connect_registration_${ack.status}`);
                }
                this.startHeartbeat();
            })
            .finally(() => {
                this.registrationPromise = null;
            });
        return this.registrationPromise;
    }

    async disconnectGracefully(): Promise<void> {
        this.stopHeartbeat();
        if (this.isConnected) {
            const timeout = new Promise<void>((resolve) => setTimeout(resolve, 2_000));
            const disconnect = this.invoke<ConnectCommandAck>('DisconnectConnection', {
                commandId: this.commandIds.create(),
            }).then(() => undefined);
            await Promise.race([disconnect, timeout]).catch(() => undefined);
        }
        await this.connection.stop();
        this.store.clear();
    }

    private registerHandlers(): void {
        this.connection.on('PlayerStateChanged', (event: PlayerStateChangedEvent) =>
            this.applier.applyPlayerEvent(event),
        );
        this.connection.on('QueueStateChanged', (event: QueueStateChangedEvent) =>
            this.applier.applyQueueEvent(event),
        );
        this.connection.on('PresenceStateChanged', (event: PresenceStateChangedEvent) =>
            this.applier.applyPresenceEvent(event),
        );
        this.connection.on('PlayerQueueStateChanged', (event: PlayerQueueStateChangedEvent) =>
            this.applier.applyPlayerQueueEvent(event),
        );
        this.connection.on('PlayerPresenceStateChanged', (event: PlayerPresenceStateChangedEvent) =>
            this.applier.applyPlayerPresenceEvent(event),
        );
        this.connection.onreconnecting(() => {
            this.stopHeartbeat();
            this.playerState.pause();
            this.store.setTransportState('reconnecting');
            this.telemetry.emit('connect_transport_reconnecting');
        });
        this.connection.onreconnected(() => {
            this.store.setTransportState('connected');
            this.telemetry.emit('connect_transport_connected', { reconnected: true });
            void this.restoreSession().catch(() => this.store.setSyncStatus('OutOfSync'));
        });
        this.connection.onclose(() => {
            this.stopHeartbeat();
            this.playerState.pause();
            this.store.setTransportState('disconnected');
            this.telemetry.emit('connect_transport_disconnected');
        });
    }

    private async restoreSession(): Promise<void> {
        await this.refreshSnapshot();
        await this.registerConnection();
        // Registration establishes a new connection membership and may change ownership.
        // Reconcile again before the media projection is allowed to act on Presence.
        await this.refreshSnapshot();
    }

    private requestSnapshot(): Promise<boolean> {
        if (this.snapshotPromise) return this.snapshotPromise;
        if (!this.isConnected) return Promise.resolve(false);

        this.snapshotPromise = this.invoke<ConnectSnapshotResponse>('GetSnapshot')
            .then((snapshot) => {
                if (snapshot.status === 'Applied') {
                    return this.store.applySnapshot(snapshot);
                }
                this.store.setSyncStatus(
                    snapshot.status === 'Unavailable' ? 'Unavailable' : 'OutOfSync',
                );
                return false;
            })
            .catch(() => {
                this.store.setSyncStatus('OutOfSync');
                return false;
            })
            .finally(() => {
                this.snapshotPromise = null;
            });
        return this.snapshotPromise;
    }

    private startHeartbeat(): void {
        if (this.heartbeatId !== null) return;
        this.scheduleHeartbeat();
    }

    private stopHeartbeat(): void {
        if (this.heartbeatId === null) return;
        clearTimeout(this.heartbeatId);
        this.heartbeatId = null;
    }

    private scheduleHeartbeat(): void {
        this.heartbeatId = setTimeout(async () => {
            this.heartbeatId = null;
            await this.sendHeartbeat();
            if (this.isConnected) this.scheduleHeartbeat();
        }, this.timing.heartbeatDelay(HEARTBEAT_INTERVAL_MS));
    }

    private async sendHeartbeat(): Promise<void> {
        if (!this.isConnected) return;
        try {
            const ack = await this.invoke<ConnectCommandAck>('RefreshConnectionLease');
            if (ack.status === 'ConnectionNotFound') await this.registerConnection();
            if (ack.status === 'Unavailable') this.store.setSyncStatus('Unavailable');
        } catch {
            // Automatic reconnect owns transport recovery.
        }
    }
}
