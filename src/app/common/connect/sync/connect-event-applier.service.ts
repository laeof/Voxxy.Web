import { Injectable } from '@angular/core';
import { ConnectStateStore } from '../state/connect-state.store';
import {
    PlayerPresenceStateChangedEvent,
    PlayerQueueStateChangedEvent,
    PlayerStateChangedEvent,
    PresenceStateChangedEvent,
    QueueStateChangedEvent,
} from '../transport/connect-transport.models';

@Injectable({ providedIn: 'root' })
export class ConnectEventApplierService {
    private recoverSnapshot: (() => Promise<void>) | null = null;

    constructor(private readonly store: ConnectStateStore) {}

    setSnapshotRecovery(recover: () => Promise<void>): void {
        this.recoverSnapshot = recover;
    }

    applyPlayerEvent(event: PlayerStateChangedEvent): void {
        this.store.applyPlayer(event.player);
    }

    applyQueueEvent(event: QueueStateChangedEvent): void {
        console.info('[Connect v2] QueueStateChanged', event.queue);
        this.store.applyQueue(event.queue);
    }

    applyPresenceEvent(event: PresenceStateChangedEvent): void {
        this.store.applyPresence(event.presence);
    }

    applyPlayerQueueEvent(event: PlayerQueueStateChangedEvent): void {
        console.info('[Connect v2] PlayerQueueStateChanged queue', event.queue);
        if (!this.store.applyPlayerQueue(event.player, event.queue)) this.requestRecovery();
    }

    applyPlayerPresenceEvent(event: PlayerPresenceStateChangedEvent): void {
        if (!this.store.applyPlayerPresence(event.player, event.presence)) {
            this.requestRecovery();
        }
    }

    private requestRecovery(): void {
        this.store.setSyncStatus('OutOfSync');
        void this.recoverSnapshot?.();
    }
}
