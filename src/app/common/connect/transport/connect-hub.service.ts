import { Injectable } from '@angular/core';
import {
    HubConnection,
    HubConnectionBuilder,
    HubConnectionState,
    LogLevel,
} from '@microsoft/signalr';
import { environment } from '@environments/environment';
import { SignalRRetryPolicy } from '@common/policies/signalr-retry.policy';
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

const HEARTBEAT_INTERVAL_MS = 15_000;

@Injectable({ providedIn: 'root' })
export class ConnectHubService {
    private readonly connection: HubConnection;
    private connectPromise: Promise<void> | null = null;
    private heartbeatId: ReturnType<typeof setInterval> | null = null;
    private registrationPromise: Promise<void> | null = null;

    constructor(
        private readonly store: ConnectStateStore,
        private readonly applier: ConnectEventApplierService,
        private readonly identity: DeviceIdentityService,
        private readonly commandIds: CommandIdService,
    ) {
        this.connection = new HubConnectionBuilder()
            .withUrl(`${environment.apiUrl}/hubs/connect`)
            .withAutomaticReconnect(new SignalRRetryPolicy())
            .configureLogging(LogLevel.Warning)
            .build();
        this.registerHandlers();
        this.applier.setSnapshotRecovery(() => this.refreshSnapshot());
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
                this.store.setTransportState('connected');
                await this.restoreSession();
            })
            .catch((error: unknown) => {
                this.store.setTransportState('disconnected');
                throw error;
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
        if (!this.isConnected) return;
        const snapshot = await this.invoke<ConnectSnapshotResponse>('GetSnapshot');
        if (snapshot.status === 'Applied') {
            this.store.applySnapshot(snapshot);
        } else if (snapshot.status === 'Unavailable') {
            this.store.setSyncStatus('Unavailable');
        } else {
            this.store.setSyncStatus('OutOfSync');
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
            this.store.setTransportState('reconnecting');
        });
        this.connection.onreconnected(() => {
            this.store.setTransportState('connected');
            void this.restoreSession();
        });
        this.connection.onclose(() => {
            this.stopHeartbeat();
            this.store.setTransportState('disconnected');
        });
    }

    private async restoreSession(): Promise<void> {
        await this.refreshSnapshot();
        await this.registerConnection();
    }

    private startHeartbeat(): void {
        if (this.heartbeatId !== null) return;
        this.heartbeatId = setInterval(() => void this.sendHeartbeat(), HEARTBEAT_INTERVAL_MS);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatId === null) return;
        clearInterval(this.heartbeatId);
        this.heartbeatId = null;
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
