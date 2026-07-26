import { Injectable, OnDestroy } from '@angular/core';
import { ConnectCommandService } from '@common/connect/commands/connect-command.service';
import { DeviceIdentityService } from '@common/connect/device/device-identity.service';
import { ConnectStateStore } from '@common/connect/state/connect-state.store';
import {
    PlaybackSourceTypeContract,
    RepeatModeContract,
} from '@common/connect/transport/connect-transport.models';
import { RepeatMode } from '@common/enums/repeat-mode.enum';
import { Track } from '@features/track/models/track';
import { TrackService } from '@features/track/services/track.service';
import {
    Subject,
    combineLatest,
    distinctUntilChanged,
    filter,
    map,
    switchMap,
    takeUntil,
} from 'rxjs';
import { MediaPlayerStateService } from './media-player-state.service';
import { PlayerHubService } from './player-hub.service';
import { ConnectCommandCoalescer } from '@common/connect/commands/connect-command-coalescer.service';
import {
    isSamePlaybackContext,
    queueItemForDisplayedTrack,
} from '@common/connect/state/playback-context';
import { createUuid } from '@common/helpers/uuid.helper';

@Injectable({ providedIn: 'root' })
export class MediaPlayerSyncService implements OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly tracks = new Map<string, Track>();
    private lastPositionAnchor: string | null = null;
    private lastTrackId: string | null = null;
    private lastIsAudioOwner = false;
    private lastSnapshotRevision = -1;
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
        this.viewPosition$ = combineLatest([
            this.state.audioOwnerObs$.pipe(
                switchMap((isAudioOwner) =>
                    isAudioOwner
                        ? this.state.positionObs$
                        : this.connectStore.positionMs$.pipe(map((position) => position / 1000)),
                ),
            ),
            this.state.currentTrackObs$,
        ]).pipe(
            map(([position, track]) => Math.min(position, track?.duration ?? position)),
            distinctUntilChanged(),
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
        void this.startPlayback(trackId, positionMs);
    }

    playContext(
        sourceId: string,
        sourceType: PlaybackSourceTypeContract,
        tracks: readonly Track[],
    ): Promise<void> {
        if (tracks.length === 0) return Promise.resolve();
        const orderedTracks =
            sourceType === 'Album'
                ? [...tracks].sort(
                      (left, right) =>
                          (left.albumOrder ?? Number.MAX_SAFE_INTEGER) -
                              (right.albumOrder ?? Number.MAX_SAFE_INTEGER) ||
                          left.id.localeCompare(right.id),
                  )
                : tracks;
        return this.startContext(sourceId, sourceType, orderedTracks, undefined);
    }

    playContextFromDisplayedTrack(
        sourceId: string,
        sourceType: PlaybackSourceTypeContract,
        tracks: readonly Track[],
        displayedTrackIndex: number,
    ): Promise<void> {
        if (tracks.length === 0) return Promise.resolve();
        return this.startContext(
            sourceId,
            sourceType,
            tracks,
            displayedTrackIndex,
        );
    }

    private async startContext(
        sourceId: string,
        sourceType: PlaybackSourceTypeContract,
        tracks: readonly Track[],
        startIndex?: number,
    ): Promise<void> {
        const queue = this.connectStore.value.queue;
        const isCurrentContext = isSamePlaybackContext(queue, { sourceId, sourceType });
        if (isCurrentContext && queue) {
            if (startIndex !== undefined) {
                const queueItem = queueItemForDisplayedTrack(
                    queue,
                    tracks,
                    startIndex,
                );
                if (queueItem) {
                    await this.commands.selectQueueItem(queueItem.queueItemId);
                }
                return;
            }
            const player = this.connectStore.value.player;
            if (player?.isPlaying) {
                await this.commands.pause();
            } else {
                await this.commands.play();
            }
            return;
        }

        await this.commands.startPlaybackContext(
            sourceId,
            sourceType,
            tracks.map((track) => ({
                queueItemId: createUuid(),
                trackId: track.id,
            })),
            startIndex ?? 0,
        );
    }

    private async startPlayback(trackId?: string, positionMs?: number): Promise<void> {
        if (trackId) {
            const ack = await this.commands.addQueueItem(trackId);
            const queueItemId = ack.outcome?.queueItemId;
            if (!queueItemId) return;
            await this.commands.selectQueueItem(queueItemId);
            if (positionMs !== undefined) await this.commands.changePosition(positionMs);
        }

        const presence = this.connectStore.value.presence;
        const localDeviceIsUnowned =
            presence?.activeDeviceId === this.identity.deviceId &&
            presence.audioOwnerConnectionId !== this.hub.connectionId;
        if (presence?.activeDeviceId === null || localDeviceIsUnowned) {
            await this.commands.selectDevice(this.identity.deviceId);
        }

        await this.commands.play();
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
        const isAudioOwner =
            presence.activeDeviceId === this.identity.deviceId &&
            presence.audioOwnerConnectionId === this.hub.connectionId;
        const authoritativeTrackId = currentItem?.trackId ?? null;
        const positionAnchor = `${player.positionMs}:${player.positionUpdatedAt}`;
        const positionReason =
            this.lastSnapshotRevision !== this.connectStore.value.snapshotRevision
                ? 'snapshot_recovery'
                : this.lastTrackId !== authoritativeTrackId
                  ? 'track_changed'
                  : !this.lastIsAudioOwner && isAudioOwner
                    ? 'became_audio_owner'
                    : this.lastPositionAnchor !== positionAnchor
                      ? 'authoritative_position_changed'
                      : null;
        const positionSec =
            positionReason === null ? undefined : this.connectStore.getPositionMs() / 1000;
        if (positionReason !== null) {
            console.info('[Connect v2] authoritative position applied', {
                reason: positionReason,
                positionSec,
                playerVersion: player.version,
                trackId: authoritativeTrackId,
                isAudioOwner,
            });
        }
        const repeat: Record<RepeatModeContract, RepeatMode> = {
            None: RepeatMode.None,
            Queue: RepeatMode.All,
            Track: RepeatMode.One,
        };

        this.state.applyAuthoritativeState({
            isPlaying: player.isPlaying,
            positionSec,
            volumePercent: player.volumePercent,
            queue: orderedTracks,
            index,
            currentTrack,
            repeat: repeat[queue.repeatMode],
            isAudioOwner,
            currentQueueItemId: queue.currentQueueItemId,
        });
        this.lastPositionAnchor = positionAnchor;
        this.lastTrackId = authoritativeTrackId;
        this.lastIsAudioOwner = isAudioOwner;
        this.lastSnapshotRevision = this.connectStore.value.snapshotRevision;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
