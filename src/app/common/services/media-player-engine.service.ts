import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Subject, distinctUntilChanged, takeUntil, combineLatest } from 'rxjs';
import { Track } from '../../features/track/models/track';
import { MediaPlayerStateService } from './media-player-state.service';
import { environment } from '../../../environments/environment';
import { UrlHelper } from '../helpers/url.helper';
import { ApiRoutes } from '../constants/api.routes.constant';

@Injectable({ providedIn: 'root' })
export class MediaPlayerEngineService implements OnDestroy {
    private readonly audio = new Audio();
    private readonly destroy$ = new Subject<void>();
    private loadingKey: string | null = null;

    constructor(
        private readonly state: MediaPlayerStateService,
        private readonly http: HttpClient
    ) {
        this.bindState();
        this.bindAudio();
    }

    private bindState() {
        this.state.playingObs$
            .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
            .subscribe((p) => {
                p ? this.audio.play().catch(() => {}) : this.audio.pause();
            });

        this.state.volumeObs$
            .pipe(takeUntil(this.destroy$))
            .subscribe((v) => (this.audio.volume = v / 100));

        this.state.positionObs$.pipe(takeUntil(this.destroy$)).subscribe((p) => {
            if (Math.abs(this.audio.currentTime - p) > 1) {
                this.audio.currentTime = p;
            }
        });

        combineLatest([this.state.queueObs$, this.state.indexObs$])
            .pipe(takeUntil(this.destroy$))
            .subscribe(([queue, index]) => {
                if (!queue.length || index < 0) return;
                this.loadTrack(queue[index]);
            });
    }

    private loadTrack(track: Track) {
        if (!track.audioKey) return;

        if (this.loadingKey === track.audioKey) return;
        this.loadingKey = track.audioKey;

        this.http
            .get<string>(
                `${environment.apiUrl}${UrlHelper.transform(
                    ApiRoutes.Track.stream,
                    ':id',
                    track.id
                )}`
            )
            .pipe(takeUntil(this.destroy$))
            .subscribe((url) => {
                if (this.state.currentTrack?.audioKey !== track.audioKey) return;

                this.audio.src = url;
                this.audio.currentTime = 0;

                if (this.state.playing) {
                    this.audio.play().catch(() => {});
                }

                this.loadingKey = null;
            });
    }

    private bindAudio() {
        this.audio.addEventListener('timeupdate', () => {
            this.state.setPosition(this.audio.currentTime);
        });

        this.audio.addEventListener('ended', () => {
            this.state.next();
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
