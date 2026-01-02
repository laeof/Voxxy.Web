import { Injectable, OnDestroy } from '@angular/core';
import { Subject, distinctUntilChanged, takeUntil, combineLatest } from 'rxjs';
import { Track } from '../../track/models/track';
import { RepeatMode } from '../enums/repeat-mode.enum';
import { MediaPlayerStateService } from './media-player-state.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiRoutes } from '../constants/api.routes.constant';
import { UrlHelper } from '../helpers/url.helper';

@Injectable({ providedIn: 'root' })
export class MediaPlayerEngineService implements OnDestroy {
    private readonly audio = new Audio();
    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly state: MediaPlayerStateService,
        private readonly httpClient: HttpClient
    ) {
        this.connectStateToAudio();
        this.connectAudioToState();
        this.handleQueueChanges();
    }

    /* STATE → AUDIO */
    private connectStateToAudio() {
        // play / pause
        this.state.playing$
            .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
            .subscribe((p) => (p ? this.playAudio() : this.audio.pause()));

        // volume
        this.state.volumeObs$
            .pipe(takeUntil(this.destroy$))
            .subscribe((v) => (this.audio.volume = v / 100));

        // seek
        this.state.position$.pipe(takeUntil(this.destroy$)).subscribe((p) => {
            if (Math.abs(this.audio.currentTime - p) > 1) {
                this.audio.currentTime = p;
            }
        });
    }

    private playAudio(): void {
        this.httpClient
            .get<string>(
                `${environment.apiUrl}${UrlHelper.transform(
                    ApiRoutes.Track.stream,
                    ':id',
                    this.state.playingSync?.id || ''
                )}`
            )
            .pipe(takeUntil(this.destroy$))
            .subscribe((streamUrl: string) => {
                this.audio.src = streamUrl;
                this.audio.currentTime = this.state.positionSync;
                this.audio.play();
            });
    }

    /* QUEUE LOGIC */
    private handleQueueChanges() {
        combineLatest([this.state.queueObs$, this.state.queueIndexObs$])
            .pipe(takeUntil(this.destroy$))
            .subscribe(([queue, index]) => {
                if (!queue.length) return;

                let realIndex = index;

                if (index >= queue.length) {
                    if (this.state.repeatSync === RepeatMode.All) {
                        realIndex = 0;
                    } else {
                        this.state.pause();
                        return;
                    }
                }

                if (index < 0) {
                    realIndex = 0;
                }

                const track = queue[realIndex];
                this.loadTrack(track);
            });
    }

    private loadTrack(track: Track) {
        if (this.audio.src === track.audioUrl) return;

        this.audio.src = track.audioUrl;
        this.audio.load();
        this.audio.play();

        this.state.setCurrentTrack(track);
        this.state.play();
        this.state.setPosition(0);
    }

    /* AUDIO → STATE */
    private connectAudioToState() {
        // позиция
        this.audio.addEventListener('timeupdate', () => {
            this.state.setPosition(this.audio.currentTime);
        });

        // трек закончился
        this.audio.addEventListener('ended', () => {
            switch (this.state.repeatSync) {
                case RepeatMode.One:
                    this.audio.currentTime = 0;
                    this.audio.play();
                    break;

                case RepeatMode.All:
                case RepeatMode.None:
                    this.state.next();
                    break;
            }
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
