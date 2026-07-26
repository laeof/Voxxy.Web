import { Injectable, OnDestroy } from '@angular/core';
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
import { Subject, filter, firstValueFrom, take, takeUntil, timeout } from 'rxjs';

const HEARTBEAT_INTERVAL_MS = 15_000;
const INITIAL_RECONNECT_DELAY_MS = 2_000;
const READY_TIMEOUT_MS = 15_000;

@Injectable({ providedIn: 'root' })
export class ConnectHubService implements OnDestroy {
    private readonly connection: HubConnection;
    private connectPromise: Promise<void> | null = null;
    private heartbeatId: ReturnType<typeof setTimeout> | null = null;
    private initialReconnectId: ReturnType<typeof setTimeout> | null = null;
    private registrationPromise: Promise<void> | null = null;
    private snapshotPromise: Promise<boolean> | null = null;
    private allowInitialReconnect = true;
    private registeredConnectionId: string | null = null;
    private restorePromise: Promise<void> | null = null;
    private readonly destroy$ = new Subject<void>();
    private disposed = false;

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

    get isReady(): boolean {
        return this.isConnected && this.store.transportState === 'ready';
    }

    get connectionId(): string | null {
        return this.registeredConnectionId;
    }

    get diagnosticState() {
        const { player, queue, presence } = this.store.value;
        return {
            connectionExists: true,
            connectionState: this.connection.state,
            signalRConnectionId: this.connection.connectionId,
            lifecycleState: this.store.transportState,
            isReady: this.isReady,
            isRegistered: this.registeredConnectionId !== null,
            snapshotApplied: player !== null && queue !== null && presence !== null,
            recoveryInProgress: this.restorePromise !== null || this.snapshotPromise !== null,
            registeredConnectionId: this.registeredConnectionId,
            disposed: this.disposed,
            pendingCommandCount: this.store.pendingCommandCount,
            playerIsPlaying: player?.isPlaying ?? null,
            playerVersion: player?.version ?? null,
            queueSourceId: queue?.sourceId ?? null,
            queueSourceType: queue?.sourceType ?? null,
            queueCurrentQueueItemId: queue?.currentQueueItemId ?? null,
            queueCurrentTrackId:
                queue?.items.find(
                    (item) => item.queueItemId === queue.currentQueueItemId,
                )?.trackId ?? null,
            queueVersion: queue?.version ?? null,
            unavailableReason: this.getUnavailableReason(),
        };
    }

    connect(): Promise<void> {
        if (this.connectPromise) return this.connectPromise;
        if (this.isReady) return Promise.resolve();
        if (this.isConnected) return this.restoreSession();

        this.allowInitialReconnect = true;
        this.clearInitialReconnect();
        this.store.setTransportState('connecting');
        this.connectPromise = this.connection
            .start()
            .then(async () => {
                this.registeredConnectionId = null;
                this.clearInitialReconnect();
                this.store.setTransportError(null);
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
                if (mapped.kind !== 'AuthenticationFailed') {
                    this.scheduleInitialReconnect();
                }
                throw new Error(mapped.code);
            })
            .finally(() => {
                this.connectPromise = null;
            });
        return this.connectPromise;
    }

    async waitUntilReady(): Promise<void> {
        if (this.disposed) throw new Error('connect_disposed');
        if (this.isReady) return;

        const state = this.store.transportState;
        if (state === 'disconnected') {
            await this.connect();
            return;
        }
        if (state === 'unavailable') {
            if (this.isConnected) {
                await this.restoreSession();
                if (this.isReady) return;
            }
            throw new Error(this.store.transportError ?? 'connect_server_unavailable');
        }

        const terminal = await firstValueFrom(
            this.store.transportState$.pipe(
                filter((value) =>
                    value === 'ready' ||
                    value === 'disconnected' ||
                    value === 'unavailable',
                ),
                take(1),
                takeUntil(this.destroy$),
                timeout(READY_TIMEOUT_MS),
            ),
        ).catch((error: unknown) => {
            if (this.disposed) throw new Error('connect_disposed');
            if (error instanceof Error && error.name === 'TimeoutError') {
                throw new Error('connect_server_unavailable');
            }
            throw error;
        });
        if (terminal !== 'ready') {
            throw new Error(
                this.store.transportError ??
                    (terminal === 'unavailable'
                        ? 'connect_server_unavailable'
                        : 'connect_transport_disconnected'),
            );
        }
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
                if (!['Applied', 'NoChanges', 'Duplicate'].includes(ack.status)) {
                    throw new Error(ack.errorCode ?? `connect_registration_${ack.status}`);
                }
                if (!ack.outcome?.connectionId) {
                    throw new Error('connect_registration_connection_id_missing');
                }
                this.registeredConnectionId = ack.outcome.connectionId;
                this.startHeartbeat();
            })
            .finally(() => {
                this.registrationPromise = null;
            });
        return this.registrationPromise;
    }

    async disconnectGracefully(): Promise<void> {
        this.allowInitialReconnect = false;
        this.clearInitialReconnect();
        this.stopHeartbeat();
        if (this.isConnected) {
            const timeout = new Promise<void>((resolve) => setTimeout(resolve, 2_000));
            const disconnect = this.invoke<ConnectCommandAck>('DisconnectConnection', {
                commandId: this.commandIds.create(),
            }).then(() => undefined);
            await Promise.race([disconnect, timeout]).catch(() => undefined);
        }
        await this.connection.stop();
        this.registeredConnectionId = null;
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
            this.registeredConnectionId = null;
            this.stopHeartbeat();
            this.playerState.pause();
            this.store.setTransportState('reconnecting');
            this.telemetry.emit('connect_transport_reconnecting');
        });
        this.connection.onreconnected(() => {
            this.telemetry.emit('connect_transport_connected', { reconnected: true });
            void this.restoreSession().catch(() => {
                this.store.setSyncStatus('OutOfSync');
                this.store.setTransportState('unavailable');
            });
        });
        this.connection.onclose(() => {
            this.registeredConnectionId = null;
            this.stopHeartbeat();
            this.playerState.pause();
            this.store.setTransportState('disconnected');
            this.telemetry.emit('connect_transport_disconnected');
            this.scheduleInitialReconnect();
        });
    }

    private scheduleInitialReconnect(): void {
        if (!this.allowInitialReconnect || this.initialReconnectId !== null || this.isConnected) {
            return;
        }

        this.initialReconnectId = setTimeout(() => {
            this.initialReconnectId = null;
            void this.connect().catch(() => undefined);
        }, INITIAL_RECONNECT_DELAY_MS);
    }

    private clearInitialReconnect(): void {
        if (this.initialReconnectId === null) return;
        clearTimeout(this.initialReconnectId);
        this.initialReconnectId = null;
    }

    private async restoreSession(): Promise<void> {
        if (this.restorePromise) return this.restorePromise;
        this.restorePromise = (async () => {
            this.store.setTransportState('recovering');
            if (!(await this.requestSnapshot())) {
                throw new Error('connect_snapshot_recovery_failed');
            }
            this.store.setTransportState('registering');
            await this.registerConnection();
            // Registration establishes a new connection membership and may change ownership.
            // Reconcile again before commands or media projection are allowed to proceed.
            this.store.setTransportState('recovering');
            if (!(await this.requestSnapshot())) {
                throw new Error('connect_snapshot_recovery_failed');
            }
            this.store.setTransportError(null);
            this.store.setTransportState('ready');
        })()
            .catch((error: unknown) => {
                this.store.setTransportState(
                    this.isConnected ? 'unavailable' : 'disconnected',
                );
                this.store.setTransportError(
                    error instanceof Error
                        ? error.message
                        : 'connect_snapshot_recovery_failed',
                );
                throw error;
            })
            .finally(() => {
                this.restorePromise = null;
            });
        return this.restorePromise;
    }

    private requestSnapshot(): Promise<boolean> {
        if (this.snapshotPromise) return this.snapshotPromise;
        if (!this.isConnected) return Promise.resolve(false);

        this.snapshotPromise = this.invoke<ConnectSnapshotResponse>('GetSnapshot')
            .then((snapshot) => {
                if (snapshot.status === 'Applied') {
                    const applied = this.store.applySnapshot(snapshot);
                    console.info('[Connect v2] snapshot queue', snapshot.queue);
                    // A realtime event can overtake GetSnapshot. The version guard must keep
                    // rejecting that older payload, but an already-newer complete local state
                    // still satisfies the recovery barrier.
                    return applied || this.store.isSnapshotSuperseded(snapshot);
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

    private getUnavailableReason(): string | null {
        if (this.disposed) return 'service_disposed';
        if (!this.isConnected) return 'connection_not_connected';
        if (this.restorePromise !== null || this.snapshotPromise !== null) {
            return 'recovery_in_progress';
        }
        if (this.store.transportState !== 'ready') return 'lifecycle_not_ready';
        if (this.registeredConnectionId === null) return 'registration_missing';
        const { player, queue, presence } = this.store.value;
        if (!player || !queue || !presence) return 'snapshot_missing';
        return null;
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

    ngOnDestroy(): void {
        this.disposed = true;
        this.allowInitialReconnect = false;
        this.stopHeartbeat();
        this.clearInitialReconnect();
        this.destroy$.next();
        this.destroy$.complete();
    }
}
