import { Injectable, OnDestroy } from '@angular/core';
import { ConnectCommandService } from '@common/connect/commands/connect-command.service';
import { DeviceIdentityService } from '@common/connect/device/device-identity.service';
import { ConnectStateStore } from '@common/connect/state/connect-state.store';
import { RepeatModeContract } from '@common/connect/transport/connect-transport.models';
import { RepeatMode } from '@common/enums/repeat-mode.enum';
import { Track } from '@features/track/models/track';
import { TrackService } from '@features/track/services/track.service';
import { Subject, distinctUntilChanged, filter, map, takeUntil } from 'rxjs';
import { MediaPlayerStateService } from './media-player-state.service';
import { PlayerHubService } from './player-hub.service';
import { ConnectCommandCoalescer } from '@common/connect/commands/connect-command-coalescer.service';

@Injectable({ providedIn: 'root' })
export class MediaPlayerSyncService implements OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly tracks = new Map<string, Track>();
    readonly viewPosition$;

    constructor(
        private readonly state: MediaPlayerStateService,
        private readonly connectStore: ConnectStateStore,
        private readonly commands: ConnectCommandService,
        private readonly hub: PlayerHubService,
        private readonly identity: DeviceIdentityService,
        private readonly coalescer: ConnectCommandCoalescer,
        trackService: TrackService,
    ) {
        this.viewPosition$ = this.connectStore.positionMs$.pipe(
            map((position) => position / 1000),
        );
        trackService.onEntitiesChanged$
            .pipe(takeUntil(this.destroy$))
            .subscribe((tracks) => {
                for (const track of tracks) this.tracks.set(track.id, track);
                this.applyProjection();
            });

        this.connectStore.state$.pipe(takeUntil(this.destroy$)).subscribe(() => this.applyProjection());

        this.connectStore.queue$
            .pipe(
                map((queue) => queue?.items.map((item) => item.trackId) ?? []),
                map((ids) => ids.filter((id) => !this.tracks.has(id))),
                filter((ids) => ids.length > 0),
                distinctUntilChanged((a, b) => a.join('|') === b.join('|')),
                takeUntil(this.destroy$),
            )
            .subscribe((ids) => trackService.tracksBatch([...new Set(ids)]));
    }

    play(trackId?: string, positionMs?: number): void {
        if (!trackId) {
            void this.commands.play();
            return;
        }
        void this.commands.addQueueItem(trackId).then(async (ack) => {
            const queueItemId = ack.outcome?.queueItemId;
            if (!queueItemId) return;
            await this.commands.selectQueueItem(queueItemId);
            if (positionMs !== undefined) await this.commands.changePosition(positionMs);
            await this.commands.play();
        });
    }

    pause(): void {
        void this.commands.pause();
    }

    setVolume(volume: number): void {
        this.coalescer.setVolume(volume);
    }

    seek(positionSec: number): void {
        this.coalescer.commitSeek(positionSec);
    }

    previewSeek(positionSec: number): void {
        this.coalescer.previewSeek(positionSec);
    }

    next(): void {
        void this.commands.next();
    }

    previous(): void {
        void this.commands.previous();
    }

    setRepeat(mode: RepeatMode): void {
        const contract: Record<RepeatMode, RepeatModeContract> = {
            [RepeatMode.None]: 'None',
            [RepeatMode.All]: 'Queue',
            [RepeatMode.One]: 'Track',
        };
        void this.commands.changeRepeatMode(contract[mode]);
    }

    private applyProjection(): void {
        const { player, queue, presence } = this.connectStore.value;
        if (!player || !queue || !presence) return;

        const orderedTracks = queue.items
            .map((item) => this.tracks.get(item.trackId))
            .filter((track): track is Track => track !== undefined);
        const index = queue.items.findIndex(
            (item) => item.queueItemId === queue.currentQueueItemId,
        );
        const currentItem = index >= 0 ? queue.items[index] : null;
        const currentTrack = currentItem ? (this.tracks.get(currentItem.trackId) ?? null) : null;
        const repeat: Record<RepeatModeContract, RepeatMode> = {
            None: RepeatMode.None,
            Queue: RepeatMode.All,
            Track: RepeatMode.One,
        };

        this.state.applyAuthoritativeState({
            isPlaying: player.isPlaying,
            positionSec: player.positionMs / 1000,
            volumePercent: player.volumePercent,
            queue: orderedTracks,
            index,
            currentTrack,
            repeat: repeat[queue.repeatMode],
            isAudioOwner:
                presence.activeDeviceId === this.identity.deviceId &&
                presence.audioOwnerConnectionId === this.hub.connectionId,
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
