import { Injectable } from '@angular/core';
import { ClientPlayerState } from '@common/entities/PlayerState';
import { RepeatMode } from '@common/enums/repeat-mode.enum';
import { Track } from '@features/track/models/track';
import { BehaviorSubject } from 'rxjs';

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

    private readonly device$ = new BehaviorSubject<boolean>(true);

    readonly playingObs$ = this.playing$.asObservable();
    readonly positionObs$ = this.position$.asObservable();
    readonly volumeObs$ = this.volume$.asObservable();
    readonly queueObs$ = this.queue$.asObservable();
    readonly indexObs$ = this.index$.asObservable();
    readonly currentTrackObs$ = this.currentTrack$.asObservable();
    readonly repeatObs$ = this.repeat$.asObservable();
    readonly deviceObs$ = this.device$.asObservable();

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
        this.device$.next(isActive);
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
