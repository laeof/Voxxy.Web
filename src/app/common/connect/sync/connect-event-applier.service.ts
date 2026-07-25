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
        const gap = this.store.hasGap(event.player.version, this.store.value.player?.version);
        this.store.applyPlayer(event.player);
        if (gap) this.requestRecovery();
    }

    applyQueueEvent(event: QueueStateChangedEvent): void {
        const gap = this.store.hasGap(event.queue.version, this.store.value.queue?.version);
        this.store.applyQueue(event.queue);
        if (gap) this.requestRecovery();
    }

    applyPresenceEvent(event: PresenceStateChangedEvent): void {
        const gap = this.store.hasGap(event.presence.version, this.store.value.presence?.version);
        this.store.applyPresence(event.presence);
        if (gap) this.requestRecovery();
    }

    applyPlayerQueueEvent(event: PlayerQueueStateChangedEvent): void {
        const gap =
            this.store.hasGap(event.player.version, this.store.value.player?.version) ||
            this.store.hasGap(event.queue.version, this.store.value.queue?.version);
        if (!this.store.applyPlayerQueue(event.player, event.queue) || gap) this.requestRecovery();
    }

    applyPlayerPresenceEvent(event: PlayerPresenceStateChangedEvent): void {
        const gap =
            this.store.hasGap(event.player.version, this.store.value.player?.version) ||
            this.store.hasGap(event.presence.version, this.store.value.presence?.version);
        if (!this.store.applyPlayerPresence(event.player, event.presence) || gap) {
            this.requestRecovery();
        }
    }

    private requestRecovery(): void {
        this.store.setSyncStatus('OutOfSync');
        void this.recoverSnapshot?.();
    }
}
