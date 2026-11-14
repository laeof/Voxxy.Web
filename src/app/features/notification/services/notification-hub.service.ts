import { Injectable, signal } from '@angular/core';
import { environment } from '@environments/environment';
import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import {
    NotificationDto,
    NotificationReadEvent,
    NotificationsReadAllEvent,
} from '../models/notification';
import { NotificationHubConnectionFactory } from './notification-hub-connection.factory';
import { NotificationService } from './notification.service';

export type NotificationRealtimeState =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'reconnecting';

@Injectable({ providedIn: 'root' })
export class NotificationHubService {
    private static readonly recoveryDelays = [2_000, 5_000, 10_000, 30_000] as const;

    private readonly connection: HubConnection;
    private readonly realtimeStateValue = signal<NotificationRealtimeState>('disconnected');
    private connectPromise: Promise<void> | null = null;
    private synchronizationPromise: Promise<void> | null = null;
    private recoveryTimer: ReturnType<typeof setTimeout> | null = null;
    private recoveryAttempt = 0;
    private stoppedExplicitly = false;

    readonly realtimeState = this.realtimeStateValue.asReadonly();

    constructor(
        connectionFactory: NotificationHubConnectionFactory,
        private readonly notifications: NotificationService,
    ) {
        this.connection = connectionFactory.create(`${environment.apiUrl}/hubs/notifications`);
        this.registerHandlers();
    }

    async initialize(): Promise<void> {
        await this.synchronizeSafely();
        await this.connect();
    }

    connect(): Promise<void> {
        if (this.connection.state === HubConnectionState.Connected) {
            return this.synchronizeSafely();
        }
        if (this.connectPromise) return this.connectPromise;

        this.stoppedExplicitly = false;
        this.realtimeStateValue.set('connecting');
        this.connectPromise = this.connection
            .start()
            .then(async () => {
                this.clearRecoveryTimer();
                this.recoveryAttempt = 0;
                this.realtimeStateValue.set('connected');
                await this.synchronizeSafely();
            })
            .catch((error: unknown) => {
                this.realtimeStateValue.set('disconnected');
                this.scheduleRecovery();
                throw error;
            })
            .finally(() => {
                this.connectPromise = null;
            });
        return this.connectPromise;
    }

    async disconnect(): Promise<void> {
        this.stoppedExplicitly = true;
        this.clearRecoveryTimer();
        this.connectPromise = null;
        if (this.connection.state !== HubConnectionState.Disconnected) {
            await this.connection.stop();
        }
        this.realtimeStateValue.set('disconnected');
        this.notifications.clear();
    }

    private registerHandlers(): void {
        this.connection.on('NotificationReceived', (notification: NotificationDto) => {
            this.notifications.applyReceived(notification);
        });
        this.connection.on('NotificationRead', (event: NotificationReadEvent) => {
            this.notifications.applyRead(event);
        });
        this.connection.on('NotificationsReadAll', (event: NotificationsReadAllEvent) => {
            this.notifications.applyReadAll(event);
        });
        this.connection.onreconnecting(() => {
            if (!this.stoppedExplicitly) this.realtimeStateValue.set('reconnecting');
        });
        this.connection.onreconnected(() => {
            if (this.stoppedExplicitly) return;
            this.realtimeStateValue.set('connected');
            this.clearRecoveryTimer();
            this.recoveryAttempt = 0;
            void this.synchronizeSafely();
        });
        this.connection.onclose(() => {
            this.realtimeStateValue.set('disconnected');
            this.scheduleRecovery();
        });
    }

    private synchronize(): Promise<void> {
        if (this.synchronizationPromise) return this.synchronizationPromise;
        this.synchronizationPromise = this.notifications.synchronize().finally(() => {
            this.synchronizationPromise = null;
        });
        return this.synchronizationPromise;
    }

    private async synchronizeSafely(): Promise<void> {
        try {
            await this.synchronize();
        } catch {
            // HTTP remains the source of truth and the next recovery cycle retries synchronization.
        }
    }

    private scheduleRecovery(): void {
        if (this.stoppedExplicitly || this.recoveryTimer !== null) return;
        const delay = NotificationHubService.recoveryDelays[
            Math.min(this.recoveryAttempt, NotificationHubService.recoveryDelays.length - 1)
        ];
        this.recoveryAttempt++;
        this.recoveryTimer = setTimeout(() => {
            this.recoveryTimer = null;
            void this.connect().catch(() => undefined);
        }, delay);
    }

    private clearRecoveryTimer(): void {
        if (this.recoveryTimer === null) return;
        clearTimeout(this.recoveryTimer);
        this.recoveryTimer = null;
    }
}
