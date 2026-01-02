import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Track } from '../../track/models/track';
import { RepeatMode } from '../enums/repeat-mode.enum';

@Injectable({ providedIn: 'root' })
export class MediaPlayerStateService {
    private readonly isPlaying$ = new BehaviorSubject(false);
    private readonly trackPosition$ = new BehaviorSubject(0);
    private readonly volume$ = new BehaviorSubject(50);
    private readonly currentTrack$ = new BehaviorSubject<Track | null>(null);

    private readonly queue$ = new BehaviorSubject<Track[]>([]);
    private readonly queueIndex$ = new BehaviorSubject<number>(-1);
    private readonly repeatMode$ = new BehaviorSubject<RepeatMode>(RepeatMode.None);

    readonly playing$ = this.isPlaying$.asObservable();
    readonly position$ = this.trackPosition$.asObservable();
    readonly volumeObs$ = this.volume$.asObservable();
    readonly track$ = this.currentTrack$.asObservable();
    readonly queueObs$ = this.queue$.asObservable();
    readonly queueIndexObs$ = this.queueIndex$.asObservable();
    readonly repeatModeObs$ = this.repeatMode$.asObservable();

    get isPlayingSync() {
        return this.isPlaying$.value;
    }
    get queueSync() {
        return this.queue$.value;
    }
    get indexSync() {
        return this.queueIndex$.value;
    }
    get repeatSync() {
        return this.repeatMode$.value;
    }
    get playingSync() {
        return this.currentTrack$.value;
    }
    get positionSync() {
        return this.trackPosition$.value;
    }

    playQueue(tracks: Track[], startIndex = 0) {
        this.queue$.next([...tracks]);
        this.queueIndex$.next(startIndex);
        this.currentTrack$.next(tracks[startIndex] ?? null);
        this.isPlaying$.next(true);
    }

    removeAt(index: number) {
        const queue = [...this.queue$.value];
        queue.splice(index, 1);

        let current = this.queueIndex$.value;

        if (index < current) current--;
        if (index === current) {
            this.currentTrack$.next(queue[current] ?? null);
        }

        this.queue$.next(queue);
        this.queueIndex$.next(Math.max(current, 0));
    }

    addNext(track: Track) {
        const queue = [...this.queue$.value];
        const insertAt = this.queueIndex$.value + 1;

        queue.splice(insertAt, 0, track);
        this.queue$.next(queue);
    }

    addLast(track: Track) {
        this.queue$.next([...this.queue$.value, track]);
    }

    move(from: number, to: number) {
        /* todo drag & drop (for future)*/

        const queue = [...this.queue$.value];
        const [item] = queue.splice(from, 1);
        queue.splice(to, 0, item);

        let index = this.queueIndex$.value;

        if (from === index) index = to;
        else if (from < index && to >= index) index--;
        else if (from > index && to <= index) index++;

        this.queue$.next(queue);
        this.queueIndex$.next(index);
    }

    shuffle() {
        const current = this.queueIndex$.value;
        const queue = [...this.queue$.value];

        const [playing] = queue.splice(current, 1);
        const shuffled = queue.sort(() => Math.random() - 0.5);

        this.queue$.next([playing, ...shuffled]);
        this.queueIndex$.next(0);
    }

    clearQueue() {
        this.queue$.next([]);
        this.queueIndex$.next(-1);
        this.currentTrack$.next(null);
        this.isPlaying$.next(false);
    }

    play() {
        this.isPlaying$.next(true);
    }

    pause() {
        this.isPlaying$.next(false);
    }

    setQueue(tracks: Track[], startIndex = 0) {
        this.queue$.next(tracks);
        this.queueIndex$.next(startIndex);
        this.currentTrack$.next(tracks[startIndex] ?? null);
    }

    next() {
        if (this.queueIndex$.value + 1 >= this.queue$.value.length) {
            this.queueIndex$.next(0);
            return;
        }

        this.queueIndex$.next(this.queueIndex$.value + 1);
    }

    prev() {
        if (this.queueIndex$.value - 1 < 0) {
            return;
        }

        this.queueIndex$.next(this.queueIndex$.value - 1);
    }

    setRepeat(mode: RepeatMode) {
        this.repeatMode$.next(mode);
    }

    setPosition(sec: number) {
        this.trackPosition$.next(sec);
    }

    setVolume(v: number) {
        this.volume$.next(v);
    }

    setCurrentTrack(track: Track | null) {
        this.currentTrack$.next(track);
    }
}
