import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, OnDestroy } from '@angular/core';
import { Subject, distinctUntilChanged, finalize, takeUntil } from 'rxjs';
import { Track } from '../../features/track/models/track';
import { MediaPlayerStateService } from '@common/services/media-player-state.service';
import { environment } from '../../../environments/environment';
import { UrlHelper } from '../helpers/url.helper';
import { ApiRoutes } from '../constants/api.routes.constant';
import { ConnectCommandService } from '@common/connect/commands/connect-command.service';

@Injectable({ providedIn: 'root' })
export class MediaPlayerEngineService implements OnDestroy {
    private readonly audio = new Audio();
    private readonly destroy$ = new Subject<void>();
    private loadingKey: string | null = null;
    private loadedKey: string | null = null;
    private isAudioOwner: boolean = false;
    private ending = false;
    private completedQueueItemId: string | null = null;
    private readonly audioEnded = () => void this.handleEnded();
    private readonly retryPlayback = () => {
        if (this.state.playing && this.isAudioOwner && this.audio.paused) {
            this.tryPlay('user-interaction-retry');
        }
    };

    constructor(
        private readonly state: MediaPlayerStateService,
        private readonly http: HttpClient,
        private readonly injector: Injector,
    ) {
        this.bindState();
        this.bindAudio();
        globalThis.addEventListener?.('pointerdown', this.retryPlayback);
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
        this.state.audioOwnerObs$
            .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
            .subscribe((value: boolean) => {
                this.isAudioOwner = value;
                this.log('ownership changed', { isAudioOwner: value });

                if (value) {
                    if (this.state.currentTrack) this.loadTrack(this.state.currentTrack);
                } else if (!this.audio.paused) {
                    this.log('pause requested', { reason: 'ownership-lost' });
                    this.audio.pause();
                }
            });

        this.state.playingObs$
            .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
            .subscribe((p) => {
                this.log('authoritative playing changed', { isPlaying: p });
                if (p && this.isAudioOwner) {
                    if (this.audio.paused) this.tryPlay('authoritative-playing-state');
                } else if (!this.audio.paused) {
                    this.log('pause requested', {
                        reason: p ? 'not-audio-owner' : 'authoritative-paused',
                    });
                    this.audio.pause();
                }
            });

        this.state.volumeObs$
            .pipe(takeUntil(this.destroy$))
            .subscribe((v) => {
                this.audio.volume = v / 100;
                this.log('volume applied', { volumePercent: v });
            });

        this.state.positionObs$.pipe(takeUntil(this.destroy$)).subscribe((p) => {
            if (Math.abs(this.audio.currentTime - p) > 1) {
                this.audio.currentTime = p;
            }
            if (p < 1 && this.completedQueueItemId !== null) {
                this.completedQueueItemId = null;
                if (this.state.playing && this.isAudioOwner && this.audio.paused) {
                    this.tryPlay('authoritative-track-repeat');
                }
            }
        });

        this.state.currentTrackObs$
            .pipe(
                distinctUntilChanged(
                    (previous, current) => previous?.audioKey === current?.audioKey,
                ),
                takeUntil(this.destroy$),
            )
            .subscribe((track) => {
                this.log('current track changed', {
                    trackId: track?.id ?? null,
                    audioKey: track?.audioKey ?? null,
                });
                if (!track) {
                    this.audio.pause();
                    this.audio.removeAttribute('src');
                    this.audio.load();
                    this.loadedKey = null;
                    return;
                }
                this.loadTrack(track);
            });
    }

    private loadTrack(track: Track) {
        if (!track.audioKey) {
            this.log('track load skipped', { reason: 'missing-audio-key', trackId: track.id });
            return;
        }

        if (this.loadedKey === track.audioKey) {
            this.log('track source reused', { trackId: track.id, audioKey: track.audioKey });
            this.applyPlaybackState();
            return;
        }
        if (this.loadingKey === track.audioKey) {
            this.log('track load skipped', { reason: 'already-loading', trackId: track.id });
            return;
        }
        this.loadingKey = track.audioKey;
        this.log('stream URL requested', { trackId: track.id, audioKey: track.audioKey });

        this.http
            .get<string>(
                `${environment.apiUrl}${UrlHelper.transform(
                    ApiRoutes.Track.stream,
                    ':id',
                    track.id,
                )}`,
            )
            .pipe(
                finalize(() => {
                    if (this.loadingKey === track.audioKey) this.loadingKey = null;
                }),
                takeUntil(this.destroy$),
            )
            .subscribe({
                next: (url) => {
                    if (this.state.currentTrack?.audioKey !== track.audioKey) {
                        this.log('stream URL ignored', {
                            reason: 'track-changed-during-request',
                            requestedTrackId: track.id,
                            currentTrackId: this.state.currentTrack?.id ?? null,
                        });
                        return;
                    }

                    this.audio.src = url;
                    this.loadedKey = track.audioKey;
                    this.log('stream URL applied', {
                        trackId: track.id,
                        source: this.safeSource(url),
                    });
                    this.applyPlaybackState();
                },
                error: (error: unknown) => {
                    console.error('[Connect v2][MediaEngine] stream URL request failed', {
                        trackId: track.id,
                        audioKey: track.audioKey,
                        error,
                    });
                },
            });
    }

    private applyPlaybackState(): void {
        this.audio.currentTime = this.state.position;
        if (this.state.playing && this.isAudioOwner) {
            if (this.audio.paused) this.tryPlay('track-stream-ready');
        } else if (!this.audio.paused) {
            this.audio.pause();
        }
    }

    private tryPlay(reason: string): void {
        this.log('play requested', { reason });
        void this.audio
            .play()
            .then(() => this.log('play promise resolved', { reason }))
            .catch((error: unknown) => {
                console.error('[Connect v2][MediaEngine] play promise rejected', {
                    reason,
                    error,
                    snapshot: this.engineSnapshot(),
                });
            });
    }

    private bindAudio() {
        this.audio.addEventListener('timeupdate', () => {
            this.state.setPosition(this.audio.currentTime);
        });

        this.audio.addEventListener('error', () => {
            console.error('[Connect v2][MediaEngine] audio event: error', {
                mediaErrorCode: this.audio.error?.code ?? null,
                mediaErrorMessage: this.audio.error?.message ?? null,
                snapshot: this.engineSnapshot(),
            });
        });
        this.audio.addEventListener('ended', this.audioEnded);
    }

    private async handleEnded(): Promise<void> {
        const queueItemId = this.state.currentQueueItemId;
        if (
            this.ending ||
            !this.isAudioOwner ||
            !queueItemId ||
            this.completedQueueItemId === queueItemId
        ) {
            return;
        }

        const durationSec = Number.isFinite(this.audio.duration)
            ? this.audio.duration
            : (this.state.currentTrack?.duration ?? this.audio.currentTime);
        const completedPositionSec = Math.max(0, durationSec);
        this.state.setPosition(completedPositionSec);
        this.ending = true;
        this.completedQueueItemId = queueItemId;

        try {
            const commands = this.injector.get(ConnectCommandService);
            const ack = await commands.completeCurrentTrack(
                queueItemId,
                Math.round(completedPositionSec * 1000),
            );
            if (!['Applied', 'NoChanges', 'Duplicate'].includes(ack.status)) {
                await commands.recoverSnapshot();
                this.completedQueueItemId = null;
            }
        } catch {
            await this.injector.get(ConnectCommandService).recoverSnapshot();
            this.completedQueueItemId = null;
        } finally {
            this.ending = false;
        }
    }

    private log(message: string, details: Record<string, unknown> = {}): void {
        void message;
        void details;
    }

    private engineSnapshot(): Record<string, unknown> {
        return {
            authoritativePlaying: this.state.playing,
            isAudioOwner: this.isAudioOwner,
            currentTrackId: this.state.currentTrack?.id ?? null,
            loadedKey: this.loadedKey,
            loadingKey: this.loadingKey,
            source: this.safeSource(this.audio.currentSrc || this.audio.src),
            paused: this.audio.paused,
            currentTime: this.audio.currentTime,
            duration: Number.isFinite(this.audio.duration) ? this.audio.duration : null,
            readyState: this.audio.readyState,
            networkState: this.audio.networkState,
            volume: this.audio.volume,
            muted: this.audio.muted,
        };
    }

    private safeSource(value: string): string | null {
        if (!value) return null;
        try {
            const url = new URL(value, globalThis.location?.origin);
            return `${url.origin}${url.pathname}`;
        } catch {
            return value.split('?')[0];
        }
    }

    ngOnDestroy() {
        globalThis.removeEventListener?.('pointerdown', this.retryPlayback);
        this.audio.removeEventListener('ended', this.audioEnded);
        this.destroy$.next();
        this.destroy$.complete();
    }
}
