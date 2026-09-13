import { Injectable, OnDestroy } from '@angular/core';
import {
    HubConnection,
    HubConnectionState,
} from '@microsoft/signalr';
import { environment } from '@environments/environment';
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
const RECOVERY_DELAYS_MS = [2_000, 5_000, 10_000, 30_000] as const;
const READY_TIMEOUT_MS = 15_000;

@Injectable({ providedIn: 'root' })
export class ConnectHubService implements OnDestroy {
    private readonly connection: HubConnection;
    private connectPromise: Promise<void> | null = null;
    private heartbeatId: ReturnType<typeof setTimeout> | null = null;
    private heartbeatGeneration = 0;
    private heartbeatInFlight = false;
    private initialReconnectId: ReturnType<typeof setTimeout> | null = null;
    private recoveryAttempt = 0;
    private registrationPromise: Promise<void> | null = null;
    private snapshotPromise: Promise<boolean> | null = null;
    private allowInitialReconnect = true;
    private registeredConnectionId: string | null = null;
    private restorePromise: Promise<void> | null = null;
    private readonly destroy$ = new Subject<void>();
    private readonly offlineHandler = () => {
        if (this.disposed) return;
        this.stopHeartbeat();
        this.store.setTransportState('unavailable');
    };
    private lifecycleGeneration = 0;
    private disposePromise: Promise<void> | null = null;
    private disposed = false;

    constructor(
        private readonly store: ConnectStateStore,
        private readonly applier: ConnectEventApplierService,
        private readonly identity: DeviceIdentityService,
        private readonly commandIds: CommandIdService,
        private readonly connectionFactory: ConnectHubConnectionFactory,
        private readonly errors: ConnectTransportErrorMapper,
        private readonly telemetry: ConnectClientTelemetry,
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
        globalThis.addEventListener?.('offline', this.offlineHandler);
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
        if (this.disposed) return Promise.reject(new Error('connect_disposed'));
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
            runtimeSessionId: this.identity.runtimeSessionId,
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
            const disconnect = Promise.resolve(
                this.invoke<ConnectCommandAck>('DisconnectConnection', {
                    commandId: this.commandIds.create(),
                }),
            ).then(() => undefined);
            await Promise.race([disconnect, timeout]).catch(() => undefined);
        }
        await this.connection.stop();
        this.registeredConnectionId = null;
        this.store.clear();
    }

    private registerHandlers(): void {
        this.connection.on('PlayerStateChanged', (event: PlayerStateChangedEvent) => {
            if (!this.disposed) this.applier.applyPlayerEvent(event);
        });
        this.connection.on('QueueStateChanged', (event: QueueStateChangedEvent) => {
            if (!this.disposed) this.applier.applyQueueEvent(event);
        });
        this.connection.on('PresenceStateChanged', (event: PresenceStateChangedEvent) => {
            if (!this.disposed) this.applier.applyPresenceEvent(event);
        });
        this.connection.on('PlayerQueueStateChanged', (event: PlayerQueueStateChangedEvent) => {
            if (!this.disposed) this.applier.applyPlayerQueueEvent(event);
        });
        this.connection.on('PlayerPresenceStateChanged', (event: PlayerPresenceStateChangedEvent) => {
            if (!this.disposed) this.applier.applyPlayerPresenceEvent(event);
        });
        this.connection.onreconnecting(() => {
            if (this.disposed) return;
            this.lifecycleGeneration++;
            this.restorePromise = null;
            this.registeredConnectionId = null;
            this.stopHeartbeat();
            this.store.setTransportState('reconnecting');
            this.telemetry.emit('connect_transport_reconnecting');
        });
        this.connection.onreconnected(() => {
            if (this.disposed) return;
            this.telemetry.emit('connect_transport_connected', { reconnected: true });
            void this.restoreSession().catch(() => {
                this.store.setSyncStatus('OutOfSync');
                this.store.setTransportState('unavailable');
            });
        });
        this.connection.onclose(() => {
            if (this.disposed) return;
            this.lifecycleGeneration++;
            this.registeredConnectionId = null;
            this.stopHeartbeat();
            this.store.setTransportState('disconnected');
            this.telemetry.emit('connect_transport_disconnected');
            this.scheduleInitialReconnect();
        });
    }

    private scheduleInitialReconnect(): void {
        if (this.disposed || !this.allowInitialReconnect || this.initialReconnectId !== null || this.isReady) {
            return;
        }

        const delay = RECOVERY_DELAYS_MS[Math.min(this.recoveryAttempt, RECOVERY_DELAYS_MS.length - 1)];
        this.recoveryAttempt++;
        this.initialReconnectId = setTimeout(() => {
            this.initialReconnectId = null;
            const recovery = this.isConnected ? this.restoreSession() : this.connect();
            void recovery.catch(() => this.scheduleInitialReconnect());
        }, this.recoveryAttempt === 1 ? INITIAL_RECONNECT_DELAY_MS : delay);
    }

    private clearInitialReconnect(): void {
        if (this.initialReconnectId === null) return;
        clearTimeout(this.initialReconnectId);
        this.initialReconnectId = null;
    }

    private async restoreSession(): Promise<void> {
        if (this.restorePromise) return this.restorePromise;
        const generation = this.lifecycleGeneration;
        const restore = (async () => {
            this.store.setTransportState('recovering');
            if (!(await this.requestSnapshot())) {
                throw new Error('connect_snapshot_recovery_failed');
            }
            this.ensureCurrent(generation);
            this.store.setTransportState('registering');
            await this.registerConnection();
            this.ensureCurrent(generation);
            // Registration establishes a new connection membership and may change ownership.
            // Reconcile again before commands or media projection are allowed to proceed.
            this.store.setTransportState('recovering');
            if (!(await this.requestSnapshot())) {
                throw new Error('connect_snapshot_recovery_failed');
            }
            this.ensureCurrent(generation);
            this.store.setTransportError(null);
            this.store.setTransportState('ready');
            this.recoveryAttempt = 0;
            this.startHeartbeat();
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
                if (this.restorePromise === restore) this.restorePromise = null;
                if (this.store.transportState === 'unavailable') {
                    this.scheduleInitialReconnect();
                }
            });
        this.restorePromise = restore;
        return restore;
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
        const generation = ++this.heartbeatGeneration;
        this.scheduleHeartbeat(generation);
    }

    private stopHeartbeat(): void {
        this.heartbeatGeneration++;
        if (this.heartbeatId === null) return;
        clearTimeout(this.heartbeatId);
        this.heartbeatId = null;
    }

    private scheduleHeartbeat(generation: number): void {
        if (generation !== this.heartbeatGeneration || this.heartbeatId !== null) return;
        this.heartbeatId = setTimeout(async () => {
            this.heartbeatId = null;
            if (generation !== this.heartbeatGeneration || this.heartbeatInFlight) return;
            this.heartbeatInFlight = true;
            try {
                await this.sendHeartbeat();
            } finally {
                this.heartbeatInFlight = false;
                if (generation === this.heartbeatGeneration && this.isReady) {
                    this.scheduleHeartbeat(generation);
                }
            }
        }, this.timing.heartbeatDelay(HEARTBEAT_INTERVAL_MS));
    }

    private async sendHeartbeat(): Promise<void> {
        if (!this.isConnected) return;
        try {
            const ack = await this.invoke<ConnectCommandAck>('RefreshConnectionLease');
            if (ack.status === 'ConnectionNotFound') await this.restoreSession();
            if (ack.status === 'Unavailable') {
                this.store.setSyncStatus('Unavailable');
                this.store.setTransportError(ack.errorCode ?? 'connect_unavailable');
                this.store.setTransportState('unavailable');
                this.stopHeartbeat();
                this.scheduleInitialReconnect();
            }
        } catch {
            // Automatic reconnect owns transport recovery.
        }
    }

    ngOnDestroy(): void {
        void this.dispose();
    }

    dispose(): Promise<void> {
        if (this.disposePromise) return this.disposePromise;
        this.disposed = true;
        this.lifecycleGeneration++;
        this.allowInitialReconnect = false;
        this.stopHeartbeat();
        this.clearInitialReconnect();
        globalThis.removeEventListener?.('offline', this.offlineHandler);
        this.destroy$.next();
        this.destroy$.complete();
        this.disposePromise = this.disconnectGracefully();
        return this.disposePromise;
    }

    private ensureCurrent(generation: number): void {
        if (this.disposed || generation !== this.lifecycleGeneration) {
            throw new Error('connect_lifecycle_superseded');
        }
    }
}
