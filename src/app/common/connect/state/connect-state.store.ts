import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, interval, map, Observable, startWith } from 'rxjs';
import {
    ConnectSnapshotResponse,
    ConnectSyncStatus,
    ConnectTransportState,
    PlayerStateDto,
    PresenceStateDto,
    QueueStateDto,
} from '../transport/connect-transport.models';

export interface ConnectState {
    player: PlayerStateDto | null;
    queue: QueueStateDto | null;
    presence: PresenceStateDto | null;
    clockOffsetMs: number;
}

@Injectable({ providedIn: 'root' })
export class ConnectStateStore {
    private readonly stateSubject = new BehaviorSubject<ConnectState>({
        player: null,
        queue: null,
        presence: null,
        clockOffsetMs: 0,
    });
    private readonly transportSubject = new BehaviorSubject<ConnectTransportState>('disconnected');
    private readonly syncStatusSubject = new BehaviorSubject<ConnectSyncStatus>('Disconnected');
    private readonly pendingSubject = new BehaviorSubject<ReadonlySet<string>>(new Set());

    readonly state$ = this.stateSubject.asObservable();
    readonly player$ = this.state$.pipe(map((state) => state.player));
    readonly queue$ = this.state$.pipe(map((state) => state.queue));
    readonly presence$ = this.state$.pipe(map((state) => state.presence));
    readonly transportState$ = this.transportSubject.asObservable();
    readonly syncStatus$ = this.syncStatusSubject.asObservable();
    readonly pendingCommandIds$ = this.pendingSubject.asObservable();
    readonly positionMs$: Observable<number> = combineLatest([
        this.player$,
        interval(250).pipe(startWith(0)),
    ]).pipe(
        map(([player]) => {
            if (!player) return 0;
            if (!player.isPlaying) return player.positionMs;
            const serverNow = Date.now() + this.stateSubject.value.clockOffsetMs;
            return player.positionMs + Math.max(0, serverNow - Date.parse(player.positionUpdatedAt));
        }),
    );

    get value(): ConnectState {
        return this.stateSubject.value;
    }

    setTransportState(state: ConnectTransportState): void {
        this.transportSubject.next(state);
        this.syncStatusSubject.next(
            state === 'connected'
                ? 'Connected'
                : state === 'reconnecting'
                  ? 'Reconnecting'
                  : 'Disconnected',
        );
    }

    setSyncStatus(status: ConnectSyncStatus): void {
        this.syncStatusSubject.next(status);
    }

    applySnapshot(snapshot: ConnectSnapshotResponse, receivedAt = Date.now()): boolean {
        if (!snapshot.player || !snapshot.queue || !snapshot.presence) return false;
        const current = this.value;
        if (
            snapshot.player.version < (current.player?.version ?? -1) ||
            snapshot.queue.version < (current.queue?.version ?? -1) ||
            snapshot.presence.version < (current.presence?.version ?? -1)
        ) {
            return false;
        }
        this.stateSubject.next({
            player: snapshot.player,
            queue: snapshot.queue,
            presence: snapshot.presence,
            clockOffsetMs: Date.parse(snapshot.serverTime) - receivedAt,
        });
        this.syncStatusSubject.next('Connected');
        return true;
    }

    applyPlayer(player: PlayerStateDto): boolean {
        if (!this.isNewer(player.version, this.value.player?.version)) return false;
        this.stateSubject.next({ ...this.value, player });
        return true;
    }

    applyQueue(queue: QueueStateDto): boolean {
        if (!this.isNewer(queue.version, this.value.queue?.version)) return false;
        this.stateSubject.next({ ...this.value, queue });
        return true;
    }

    applyPresence(presence: PresenceStateDto): boolean {
        if (!this.isNewer(presence.version, this.value.presence?.version)) return false;
        this.stateSubject.next({ ...this.value, presence });
        return true;
    }

    applyPlayerQueue(player: PlayerStateDto, queue: QueueStateDto): boolean {
        if (!this.combinedVersionsAreConsistent(player.version, queue.version, 'queue')) return false;
        this.stateSubject.next({ ...this.value, player, queue });
        return true;
    }

    applyPlayerPresence(player: PlayerStateDto, presence: PresenceStateDto): boolean {
        if (!this.combinedVersionsAreConsistent(player.version, presence.version, 'presence')) {
            return false;
        }
        this.stateSubject.next({ ...this.value, player, presence });
        return true;
    }

    hasGap(incoming: number, current: number | undefined): boolean {
        return current !== undefined && incoming > current + 1;
    }

    addPending(commandId: string): void {
        this.pendingSubject.next(new Set([...this.pendingSubject.value, commandId]));
    }

    removePending(commandId: string): void {
        const pending = new Set(this.pendingSubject.value);
        pending.delete(commandId);
        this.pendingSubject.next(pending);
    }

    clear(): void {
        this.stateSubject.next({ player: null, queue: null, presence: null, clockOffsetMs: 0 });
        this.pendingSubject.next(new Set());
        this.setTransportState('disconnected');
    }

    private isNewer(incoming: number, current: number | undefined): boolean {
        return current === undefined || incoming > current;
    }

    private combinedVersionsAreConsistent(
        playerVersion: number,
        relatedVersion: number,
        related: 'queue' | 'presence',
    ): boolean {
        const currentPlayer = this.value.player?.version;
        const currentRelated =
            related === 'queue' ? this.value.queue?.version : this.value.presence?.version;
        const playerNew = this.isNewer(playerVersion, currentPlayer);
        const relatedNew = this.isNewer(relatedVersion, currentRelated);
        return playerNew === relatedNew && playerNew;
    }
}
