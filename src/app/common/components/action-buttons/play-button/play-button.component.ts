import { AsyncPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MediaPlayerSyncService } from '@common/services/media-player-sync.service';
import { Track } from '@features/track/models/track';
import { PlaybackSourceTypeContract } from '@common/connect/transport/connect-transport.models';
import {
    BehaviorSubject,
    combineLatest,
    distinctUntilChanged,
    map,
    shareReplay,
} from 'rxjs';
import { MediaPlayerStateService } from '@common/services/media-player-state.service';

@Component({
    selector: 'action-play-button',
    templateUrl: './play-button.component.html',
    styleUrl: './play-button.component.scss',
    imports: [MatIcon, AsyncPipe],
})
export class PlayButtonComponent {
    private readonly sourceIdSubject = new BehaviorSubject<string | null>(null);
    private readonly sourceTypeSubject =
        new BehaviorSubject<PlaybackSourceTypeContract>('Manual');
    private readonly tracksSubject = new BehaviorSubject<readonly Track[]>([]);
    private readonly inFlightSubject = new BehaviorSubject(false);
    private trackListValue: Track[] | undefined = [];
    private trackListIdValue: string | undefined;
    private sourceTypeValue: PlaybackSourceTypeContract = 'Manual';

    constructor(
        private readonly mediaPlayerSyncService: MediaPlayerSyncService,
        playerState: MediaPlayerStateService,
    ) {
        this.viewModel$ = combineLatest([
            playerState.playingObs$,
            playerState.sourceIdObs$,
            playerState.sourceTypeObs$,
            this.sourceIdSubject,
            this.sourceTypeSubject,
            this.tracksSubject,
            this.inFlightSubject,
        ]).pipe(
            map(
                ([playing, activeSourceId, activeSourceType, sourceId, sourceType, tracks, inFlight]) => ({
                    showPause:
                        sourceId !== null &&
                        activeSourceId === sourceId &&
                        activeSourceType === sourceType &&
                        playing,
                    disabled: inFlight || sourceId === null || tracks.length === 0,
                }),
            ),
            distinctUntilChanged(
                (previous, current) =>
                    previous.showPause === current.showPause &&
                    previous.disabled === current.disabled,
            ),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
        this.isCurrentContextPlaying$ = this.viewModel$.pipe(
            map((viewModel) => viewModel.showPause),
            distinctUntilChanged(),
        );
    }

    @Input()
    set trackList(value: Track[] | undefined) {
        this.trackListValue = value;
        this.tracksSubject.next(value ?? []);
    }
    get trackList(): Track[] | undefined {
        return this.trackListValue;
    }
    @Input()
    set trackListId(value: string | undefined) {
        this.trackListIdValue = value;
        this.sourceIdSubject.next(value ?? null);
    }
    get trackListId(): string | undefined {
        return this.trackListIdValue;
    }

    @Input()
    set sourceType(value: PlaybackSourceTypeContract) {
        this.sourceTypeValue = value;
        this.sourceTypeSubject.next(value);
    }
    get sourceType(): PlaybackSourceTypeContract {
        return this.sourceTypeValue;
    }
    readonly isCurrentContextPlaying$;
    readonly viewModel$;

    get inFlight(): boolean {
        return this.inFlightSubject.value;
    }

    togglePlayButton(): void {
        if (this.inFlight || !this.trackList || this.trackList.length === 0) return;
        if (!this.trackListId) return;
        void this.executeToggle(this.trackListId, this.trackList);
    }

    private async executeToggle(sourceId: string, tracks: readonly Track[]): Promise<void> {
        this.inFlightSubject.next(true);
        try {
            await this.mediaPlayerSyncService.playContext(
                sourceId,
                this.sourceType,
                tracks,
            );
        } catch (error: unknown) {
            console.error('[Connect v2] playback context command failed', {
                sourceId,
                sourceType: this.sourceType,
                error,
            });
        } finally {
            this.inFlightSubject.next(false);
        }
    }
}
