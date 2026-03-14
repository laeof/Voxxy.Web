import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Track } from '../../track/models/track';
import { RepeatMode } from '../enums/repeat-mode.enum';

@Injectable({ providedIn: 'root' })
export class MediaPlayerStateService {
    private readonly playing$ = new BehaviorSubject(false);
    private readonly position$ = new BehaviorSubject(0);
    private readonly volume$ = new BehaviorSubject(50);

    private readonly queue$ = new BehaviorSubject<Track[]>([]);
    private readonly index$ = new BehaviorSubject<number>(-1);
    private readonly current$ = new BehaviorSubject<Track | null>(null);
    private readonly repeat$ = new BehaviorSubject<RepeatMode>(RepeatMode.None);

    readonly playingObs$ = this.playing$.asObservable();
    readonly positionObs$ = this.position$.asObservable();
    readonly volumeObs$ = this.volume$.asObservable();
    readonly queueObs$ = this.queue$.asObservable();
    readonly indexObs$ = this.index$.asObservable();
    readonly currentTrack$ = this.current$.asObservable();
    readonly repeatObs$ = this.repeat$.asObservable();

    get playing() {
        return this.playing$.value;
    }
    get queue() {
        return this.queue$.value;
    }
    get index() {
        return this.index$.value;
    }
    get current() {
        return this.current$.value;
    }
    get repeat() {
        return this.repeat$.value;
    }

    play() {
        this.playing$.next(true);
    }
    pause() {
        this.playing$.next(false);
    }

    playQueue(queue: Track[], index = 0) {
        this.queue$.next(queue);
        this.index$.next(index);
        this.current$.next(queue[index] ?? null);
        this.playing$.next(true);
    }

    next() {
        if (!this.queue.length) return;

        let i = this.index + 1;

        if (this.repeat === RepeatMode.One) i = this.index;

        if (i >= this.queue.length) {
            if (this.repeat === RepeatMode.All) i = 0;
            else return this.pause();
        }

        this.index$.next(i);
        this.current$.next(this.queue[i]);
    }

    prev() {
        if (this.index <= 0) return;
        const i = this.index - 1;
        this.index$.next(i);
        this.current$.next(this.queue[i]);
    }

    setPosition(sec: number) {
        this.position$.next(sec);
    }

    setVolume(v: number) {
        this.volume$.next(v);
    }

    setRepeat(mode: RepeatMode) {
        this.repeat$.next(mode);
    }
}
