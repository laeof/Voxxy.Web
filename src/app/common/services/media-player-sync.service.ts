import { Injectable, OnDestroy } from '@angular/core';
import { filter, first, interval, map, Observable, Subject, takeUntil } from 'rxjs';
import { MediaPlayerEngineService } from './media-player-engine.service';
import { MediaPlayerStateService } from './media-player-state.service';
import { PlayerHubService } from './player-hub.service';
import { ClientPlayerState, PlayerState, PositionState } from '@common/entities/PlayerState';
import { TrackService } from '@features/track/services/track.service';
import { DeviceService } from '@common/layout/components/playerbar/components/device/services/device-service';

@Injectable({
    providedIn: 'root',
})
export class MediaPlayerSyncService implements OnDestroy {
    private readonly destroy$ = new Subject<void>();

    private positionState: PositionState | null = null;
    public readonly viewPosition$: Observable<number>;

    constructor(
        private readonly state: MediaPlayerStateService,
        private readonly engine: MediaPlayerEngineService,
        private readonly hub: PlayerHubService,
        private readonly trackService: TrackService,
        private readonly deviceService: DeviceService,
    ) {
        this.hub.position$
            .pipe(takeUntil(this.destroy$))
            .subscribe((positionState: PositionState | null) => {
                if (!positionState) return;
                this.positionState = positionState;
                this.state.setPosition(positionState.positionMs / 1000);
            });

        this.hub.volume$.pipe(takeUntil(this.destroy$)).subscribe((volume: number | null) => {
            if (volume === null) return;
            this.state.setVolume(volume);
        });

        this.hub.playerState$
            .pipe(takeUntil(this.destroy$))
            .subscribe((playerState: PlayerState | null) => {
                if (!playerState) return;

                this.positionState = {
                    positionMs: playerState.positionMs,
                    updatedAt: playerState.updatedAt,
                };

                this.state.setPosition(playerState.positionMs / 1000);

                let clientPlayerState: ClientPlayerState = {
                    position: playerState.positionMs / 1000,
                    volumePercent: playerState.volumePercent,
                    isPlaying: playerState.isPlaying,
                    updatedAt: playerState.updatedAt,
                    track: null,
                    isActiveDevice: playerState.activeDeviceId === this.hub.connectionId,
                };

                if (playerState.trackId !== this.state.currentTrack?.id) {
                    this.trackService.tracksBatch([playerState.trackId!]);
                    this.trackService.onEntitiesChanged$
                        .pipe(
                            filter((tracks) => tracks.length > 0),
                            first(),
                        )
                        .subscribe((tracks) => {
                            clientPlayerState.track = tracks[0] ?? null;
                            this.state.applyServerState(clientPlayerState);
                        });
                    return;
                }

                clientPlayerState.isPlaying ? this.state.play() : this.state.pause();

                this.state.setVolume(clientPlayerState.volumePercent);
                this.state.setPosition(clientPlayerState.position);
            });

        this.deviceService.onEntitySelected$.pipe(takeUntil(this.destroy$)).subscribe((device) => {
            this.state.applyDeviceState(this.hub.connectionId == device);
        });

        this.viewPosition$ = interval(1000).pipe(
            map(() => {
                if (this.positionState && this.state.playing) {
                    this.state.setPosition(
                        this.positionState.positionMs / 1000 +
                            (Date.now() - new Date(this.positionState.updatedAt).getTime()) / 1000,
                    );
                }

                return this.state.position;
            }),
        );
    }

    play(trackId?: string, positionMs?: number): void {
        this.state.play();

        if (!this.hub.isConnected) return;

        if (!trackId) trackId = this.state.currentTrack!.id;

        this.hub.play({
            positionMs: positionMs ?? Math.floor(this.state.position * 1000),
            updatedAt: new Date().toISOString(),
            trackId: trackId,
            queueId: null,
        });
    }

    pause(trackId?: string): void {
        this.state.pause();

        if (!this.hub.isConnected) return;

        if (!trackId) trackId = this.state.currentTrack!.id;

        this.hub.pause({
            positionMs: Math.floor(this.state.position * 1000),
            updatedAt: new Date().toISOString(),
            trackId: trackId,
            queueId: null,
        });
    }

    setVolume(volume: number): void {
        this.state.setVolume(volume);

        if (!this.hub.isConnected) return;

        this.hub.changeVolume(volume);
    }

    seek(positionSec: number): void {
        this.engine.seek(positionSec);

        if (!this.hub.isConnected) return;

        this.hub.changePosition({
            positionMs: Math.floor(positionSec * 1000),
            updatedAt: new Date().toISOString(),
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
