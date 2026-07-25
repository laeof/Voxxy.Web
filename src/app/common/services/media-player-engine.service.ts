import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Subject, distinctUntilChanged, takeUntil, combineLatest } from 'rxjs';
import { Track } from '../../features/track/models/track';
import { MediaPlayerStateService } from '@common/services/media-player-state.service';
import { environment } from '../../../environments/environment';
import { UrlHelper } from '../helpers/url.helper';
import { ApiRoutes } from '../constants/api.routes.constant';

@Injectable({ providedIn: 'root' })
export class MediaPlayerEngineService implements OnDestroy {
    private readonly audio = new Audio();
    private readonly destroy$ = new Subject<void>();
    private loadingKey: string | null = null;
    private activeDevice: boolean = false;

    constructor(
        private readonly state: MediaPlayerStateService,
        private readonly http: HttpClient,
    ) {
        this.bindState();
        this.bindAudio();
    }

    get currentTime(): number {
        return this.audio.currentTime;
    }

    get paused(): boolean {
        return this.audio.paused;
    }

    seek(positionSec: number): void {
        if (Math.abs(this.audio.currentTime - positionSec) > 0.3) {
            this.audio.currentTime = positionSec;
        }

        this.state.setPosition(positionSec);
    }

    private bindState() {
        this.state.deviceObs$.pipe(takeUntil(this.destroy$)).subscribe((value: boolean) => {
            console.log('device state changed:', value);
            this.activeDevice = value;

            if (value) {
                if (this.state.currentTrack) this.loadTrack(this.state.currentTrack);
                this.audio.currentTime = this.state.position;
                if (this.state.playing) {
                    this.audio.play().catch(() => {});
                }
            } else {
                this.audio.pause();
            }
        });

        this.state.playingObs$
            .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
            .subscribe((p) => {
                p && this.activeDevice ? this.audio.play().catch(() => {}) : this.audio.pause();
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
                    track.id,
                )}`,
            )
            .pipe(takeUntil(this.destroy$))
            .subscribe((url) => {
                if (this.state.currentTrack?.audioKey !== track.audioKey) return;

                this.audio.src = url;
                this.audio.currentTime = 0;

                console.log(this.state.playing, this.activeDevice);

                if (this.state.playing && this.activeDevice) this.audio.play().catch(() => {});

                this.loadingKey = null;
            });
    }

    private bindAudio() {
        this.audio.addEventListener('timeupdate', () => {
            this.state.setPosition(this.audio.currentTime);
        });

        // this.audio.addEventListener('playing', () => {
        //     if (!this.activeDevice) {
        //         this.state.pause();
        //     }
        // });

        // Playback completion is a user-agent observation, not authoritative state. The Connect
        // coordinator advances the queue through an explicit command owned by the UI workflow.
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
