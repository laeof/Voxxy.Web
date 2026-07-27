import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, OnDestroy } from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';
import { Track } from '../../features/track/models/track';
import {
    AuthoritativePlaybackTarget,
    MediaPlayerStateService,
} from '@common/services/media-player-state.service';
import { environment } from '../../../environments/environment';
import { UrlHelper } from '../helpers/url.helper';
import { ApiRoutes } from '../constants/api.routes.constant';
import { ConnectCommandService } from '@common/connect/commands/connect-command.service';

interface PendingSeek {
    generation: number;
    trackId: string;
    positionSec: number;
    playerVersion: number;
}

@Injectable({ providedIn: 'root' })
export class MediaPlayerEngineService implements OnDestroy {
    private readonly audio = new Audio();
    private readonly destroy$ = new Subject<void>();
    private loadingKey: string | null = null;
    private loadedKey: string | null = null;
    private loadedTrackId: string | null = null;
    private isAudioOwner: boolean = false;
    private authoritativeTarget: AuthoritativePlaybackTarget | null = null;
    private loadGeneration = 0;
    private pendingSeek: PendingSeek | null = null;
    private metadataGenerationListener: (() => void) | null = null;
    private ending = false;
    private completedQueueItemId: string | null = null;
    private readonly audioEnded = () => void this.handleEnded();
    private readonly retryPlayback = () => {
        if (this.state.playing && this.isAudioOwner && this.audio.paused) {
            this.reconcilePlayback('user-interaction-retry', this.loadGeneration);
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
        this.state.volumeObs$
            .pipe(takeUntil(this.destroy$))
            .subscribe((v) => {
                this.audio.volume = v / 100;
                this.log('volume applied', { volumePercent: v });
            });

        this.state.authoritativePlaybackObs$
            .pipe(takeUntil(this.destroy$))
            .subscribe((target) => {
                this.synchronizeAuthoritativePlayback(target);
                if (target.positionSec < 1 && this.completedQueueItemId !== null) {
                    this.completedQueueItemId = null;
                    if (target.isPlaying && target.isAudioOwner && this.audio.paused) {
                        this.reconcilePlayback(
                            'authoritative-track-repeat',
                            this.loadGeneration,
                        );
                    }
                }
            });
    }

    private synchronizeAuthoritativePlayback(
        target: AuthoritativePlaybackTarget,
    ): void {
        const previousTarget = this.authoritativeTarget;
        this.authoritativeTarget = target;
        this.isAudioOwner = target.isAudioOwner;
        this.log('authoritative target received', {
            playerVersion: target.playerVersion,
            requestedPositionSec: target.positionSec,
            ownershipChanged: previousTarget?.isAudioOwner !== target.isAudioOwner,
        });

        if (!target.track) {
            this.clearSource();
            return;
        }

        const currentGeneration = this.loadGeneration;
        const sameLoadedTrack =
            this.loadedTrackId === target.track.id &&
            this.loadedKey === target.track.audioKey;
        const sameLoadingTrack =
            this.loadingKey === target.track.audioKey &&
            previousTarget?.track?.id === target.track.id;
        const generation =
            sameLoadedTrack || sameLoadingTrack
                ? currentGeneration
                : this.beginLoadGeneration();
        this.updatePendingSeek(target, generation);

        if (sameLoadedTrack) {
            this.applyPendingSeekWhenReady('authoritative-update', generation);
            return;
        }
        if (sameLoadingTrack) {
            this.log('track load skipped', {
                reason: 'already-loading',
                trackId: target.track.id,
                generation,
            });
            return;
        }
        this.loadTrack(target.track, generation);
    }

    private loadTrack(track: Track, generation: number): void {
        if (!track.audioKey) {
            this.log('track load skipped', { reason: 'missing-audio-key', trackId: track.id });
            return;
        }
        this.loadingKey = track.audioKey;
        this.log('stream URL requested', {
            trackId: track.id,
            audioKey: track.audioKey,
            generation,
        });

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
                    if (
                        generation !== this.loadGeneration ||
                        this.authoritativeTarget?.track?.id !== track.id
                    ) {
                        this.log('stream URL ignored', {
                            reason: 'stale-load-generation',
                            requestedTrackId: track.id,
                            generation,
                        });
                        return;
                    }

                    const previousSrc = this.audio.currentSrc || this.audio.src;
                    this.audio.src = url;
                    this.loadedKey = track.audioKey;
                    this.loadedTrackId = track.id;
                    this.log('stream URL applied', {
                        trackId: track.id,
                        generation,
                        previousSrc: this.safeSource(previousSrc),
                        source: this.safeSource(url),
                    });
                    this.bindGenerationMetadataEvents(generation);
                    this.audio.load();
                    this.applyPendingSeekWhenReady('source-loaded', generation);
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

    private updatePendingSeek(
        target: AuthoritativePlaybackTarget,
        generation: number,
    ): void {
        const existing = this.pendingSeek;
        if (
            existing &&
            existing.trackId === target.track!.id &&
            existing.generation === generation &&
            existing.playerVersion > target.playerVersion
        ) {
            return;
        }
        this.pendingSeek = {
            generation,
            trackId: target.track!.id,
            positionSec: target.positionSec,
            playerVersion: target.playerVersion,
        };
        this.log('authoritative seek queued', {
            generation,
            requestedPositionSec: target.positionSec,
            playerVersion: target.playerVersion,
        });
    }

    private applyPendingSeekWhenReady(reason: string, generation: number): void {
        const pending = this.pendingSeek;
        if (
            !pending ||
            pending.generation !== generation ||
            generation !== this.loadGeneration ||
            pending.trackId !== this.loadedTrackId
        ) {
            return;
        }
        if (this.audio.readyState < HTMLMediaElement.HAVE_METADATA) {
            this.log('authoritative seek deferred', { reason, generation });
            return;
        }
        if (
            (this.audio.seekable?.length ?? 0) === 0 &&
            this.audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA
        ) {
            this.log('authoritative seek deferred', {
                reason: 'media-not-seekable-yet',
                generation,
            });
            return;
        }

        const target = pending.positionSec;
        this.log('authoritative seek applying', {
            reason,
            generation,
            requestedPositionSec: target,
            beforeCurrentTime: this.audio.currentTime,
        });
        try {
            if (Math.abs(this.audio.currentTime - target) > 0.3) {
                this.audio.currentTime = target;
            }
        } catch (error: unknown) {
            this.log('authoritative seek deferred', { reason: 'seek-threw', error });
            return;
        }
        if (Math.abs(this.audio.currentTime - target) > 0.3) {
            this.log('authoritative seek deferred', {
                reason: 'seek-not-applied',
                generation,
                requestedPositionSec: target,
            });
            return;
        }

        this.pendingSeek = null;
        this.log('authoritative seek applied', {
            reason,
            generation,
            requestedPositionSec: target,
            afterCurrentTime: this.audio.currentTime,
        });
        this.reconcilePlayback('authoritative-seek-applied', generation);
    }

    private reconcilePlayback(reason: string, generation: number): void {
        if (generation !== this.loadGeneration) return;
        const target = this.authoritativeTarget;
        if (!target || this.pendingSeek !== null) return;
        if (target.isPlaying && target.isAudioOwner) {
            if (this.audio.paused) this.tryPlay(reason, generation);
        } else if (!this.audio.paused) {
            this.log('pause requested', { reason, generation });
            this.audio.pause();
        }
    }

    private tryPlay(reason: string, generation: number): void {
        this.log('play requested', {
            reason,
            generation,
            currentTimeImmediatelyBeforePlay: this.audio.currentTime,
        });
        void this.audio.play()
            .then(() => {
                if (generation === this.loadGeneration) {
                    this.log('play promise resolved', { reason, generation });
                }
            })
            .catch((error: unknown) => {
                console.error('[Connect v2][MediaEngine] play promise rejected', {
                    reason,
                    generation,
                    error,
                    snapshot: this.engineSnapshot(),
                });
            });
    }

    private beginLoadGeneration(): number {
        this.loadGeneration++;
        this.pendingSeek = null;
        this.removeGenerationMetadataEvents();
        return this.loadGeneration;
    }

    private clearSource(): void {
        const hadSource =
            this.loadedKey !== null ||
            this.loadingKey !== null ||
            Boolean(this.audio.currentSrc || this.audio.src);
        if (!hadSource) return;

        this.beginLoadGeneration();
        this.loadingKey = null;
        this.loadedKey = null;
        this.loadedTrackId = null;
        if (!this.audio.paused) this.audio.pause();
        this.audio.removeAttribute('src');
        this.audio.load();
        this.log('audio source cleared', { reason: 'no-authoritative-track' });
    }

    private bindGenerationMetadataEvents(generation: number): void {
        this.removeGenerationMetadataEvents();
        const listener = () => {
            if (generation !== this.loadGeneration) return;
            this.applyPendingSeekWhenReady('media-ready-event', generation);
        };
        this.metadataGenerationListener = listener;
        for (const event of ['loadedmetadata', 'loadeddata', 'canplay']) {
            this.audio.addEventListener(event, listener);
        }
    }

    private removeGenerationMetadataEvents(): void {
        if (!this.metadataGenerationListener) return;
        for (const event of ['loadedmetadata', 'loadeddata', 'canplay']) {
            this.audio.removeEventListener(event, this.metadataGenerationListener);
        }
        this.metadataGenerationListener = null;
    }

    private bindAudio(): void {
        this.audio.addEventListener('timeupdate', () => {
            this.state.setPosition(this.audio.currentTime);
        });

        for (const event of [
            'loadstart',
            'loadedmetadata',
            'durationchange',
            'loadeddata',
            'canplay',
            'canplaythrough',
            'seeking',
            'seeked',
            'play',
            'playing',
            'pause',
            'emptied',
            'abort',
        ]) {
            this.audio.addEventListener(event, () => {
                this.log(`audio event: ${event}`, { event });
            });
        }

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
        console.debug('[Connect v2][MediaEngine]', message, {
            ...details,
            generation: this.loadGeneration,
            authoritativeTrackId: this.authoritativeTarget?.track?.id ?? null,
            loadedTrackId: this.loadedTrackId,
            playerVersion: this.authoritativeTarget?.playerVersion ?? null,
            requestedPositionSec: this.pendingSeek?.positionSec ?? null,
            currentSrc: this.safeSource(this.audio.currentSrc || this.audio.src),
            readyState: this.audio.readyState,
            networkState: this.audio.networkState,
            currentTime: this.audio.currentTime,
            duration: Number.isFinite(this.audio.duration) ? this.audio.duration : null,
            paused: this.audio.paused,
            seekableRanges: this.audio.seekable?.length ?? 0,
        });
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
        this.removeGenerationMetadataEvents();
        this.destroy$.next();
        this.destroy$.complete();
    }
}
