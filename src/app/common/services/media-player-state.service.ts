import { Injectable } from '@angular/core';
import { ClientPlayerState } from '@common/entities/PlayerState';
import { RepeatMode } from '@common/enums/repeat-mode.enum';
import { Track } from '@features/track/models/track';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class MediaPlayerStateService {
    private readonly playing$ = new BehaviorSubject(false);
    private readonly position$ = new BehaviorSubject<number>(0);
    private readonly volume$ = new BehaviorSubject<number>(50);

    private readonly queue$ = new BehaviorSubject<Track[]>([]);
    private readonly index$ = new BehaviorSubject<number>(-1);
    private readonly currentTrack$ = new BehaviorSubject<Track | null>(null);
    private readonly repeat$ = new BehaviorSubject<RepeatMode>(RepeatMode.None);

    private readonly audioOwner$ = new BehaviorSubject<boolean>(false);
    private readonly playbackIntent$ = new Subject<void>();
    private authoritativeQueueItemId: string | null = null;

    readonly playingObs$ = this.playing$.asObservable();
    readonly positionObs$ = this.position$.asObservable();
    readonly volumeObs$ = this.volume$.asObservable();
    readonly queueObs$ = this.queue$.asObservable();
    readonly indexObs$ = this.index$.asObservable();
    readonly currentTrackObs$ = this.currentTrack$.asObservable();
    readonly repeatObs$ = this.repeat$.asObservable();
    readonly audioOwnerObs$ = this.audioOwner$.asObservable();
    readonly playbackIntentObs$ = this.playbackIntent$.asObservable();

    get playing(): boolean {
        return this.playing$.value;
    }

    get position(): number {
        return this.position$.value;
    }

    get volume(): number {
        return this.volume$.value;
    }

    get queue(): Track[] {
        return this.queue$.value;
    }

    get index(): number {
        return this.index$.value;
    }

    get currentTrack(): Track | null {
        return this.currentTrack$.value;
    }

    get repeat(): RepeatMode {
        return this.repeat$.value;
    }

    get currentQueueItemId(): string | null {
        return this.authoritativeQueueItemId;
    }

    requestPlaybackFromUserGesture(): void {
        this.playbackIntent$.next();
    }

    applyAuthoritativeState(value: {
        isPlaying: boolean;
        positionSec?: number;
        volumePercent: number;
        queue: Track[];
        index: number;
        currentTrack: Track | null;
        repeat: RepeatMode;
        isAudioOwner: boolean;
        currentQueueItemId?: string | null;
    }): void {
        this.queue$.next(value.queue);
        this.index$.next(value.index);
        this.currentTrack$.next(value.currentTrack);
        if (value.positionSec !== undefined) {
            this.position$.next(value.positionSec);
        }
        this.volume$.next(value.volumePercent);
        this.repeat$.next(value.repeat);
        if (value.currentQueueItemId !== undefined) {
            this.authoritativeQueueItemId = value.currentQueueItemId;
        }
        this.audioOwner$.next(value.isAudioOwner);
        this.playing$.next(value.isPlaying);
    }

    applyServerState(playerState: ClientPlayerState): void {
        this.volume$.next(playerState.volumePercent);
        this.playing$.next(playerState.isPlaying);
        this.currentTrack$.next(playerState.track);
        this.queue$.next(playerState.track ? [playerState.track] : []);
        this.index$.next(playerState.track ? 0 : -1);
    }

    applyQueueState(queue: Track[], index: number): void {
        this.queue$.next(queue);
        this.index$.next(index);
    }

    applyDeviceState(isActive: boolean): void {
        this.audioOwner$.next(isActive);
    }

    play(): void {
        this.playing$.next(true);
    }

    pause(): void {
        this.playing$.next(false);
    }

    playQueue(queue: Track[], index = 0): void {
        this.queue$.next(queue);
        this.index$.next(index);
        this.currentTrack$.next(queue[index] ?? null);
        this.position$.next(0);

        console.log('playQueue', queue, index);
    }

    next(): void {
        if (!this.queue.length) return;

        let i = this.index + 1;

        if (this.repeat === RepeatMode.One) {
            i = this.index;
        }

        if (i >= this.queue.length) {
            if (this.repeat === RepeatMode.All) {
                i = 0;
            } else {
                this.pause();
                return;
            }
        }

        this.index$.next(i);
        this.currentTrack$.next(this.queue[i]);
        this.position$.next(0);
    }

    prev(): void {
        if (this.index <= 0) return;

        const i = this.index - 1;

        this.index$.next(i);
        this.currentTrack$.next(this.queue[i]);
        this.position$.next(0);
    }

    setPosition(sec: number): void {
        this.position$.next(sec);
    }

    setVolume(volume: number): void {
        this.volume$.next(volume);
    }

    setRepeat(mode: RepeatMode): void {
        this.repeat$.next(mode);
    }
}
