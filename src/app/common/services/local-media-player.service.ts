import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface LocalTrack {
    id: string;
    name: string;
    duration: number;
    audioUrl: string;
}

@Injectable({ providedIn: 'root' })
export class LocalMediaPlayerService {
    private readonly audio = new Audio();
    private readonly destroy$ = new Subject<void>();

    private readonly playing = new BehaviorSubject(false);
    private readonly currentTrack = new BehaviorSubject<LocalTrack | null>(null);
    private readonly queue = new BehaviorSubject<LocalTrack[]>([]);
    private readonly currentIndex = new BehaviorSubject<number>(-1);
    private readonly position = new BehaviorSubject(0);
    private readonly duration = new BehaviorSubject(0);

    readonly playing$ = this.playing.asObservable();
    readonly currentTrack$ = this.currentTrack.asObservable();
    readonly queue$ = this.queue.asObservable();
    readonly currentIndex$ = this.currentIndex.asObservable();
    readonly position$ = this.position.asObservable();
    readonly duration$ = this.duration.asObservable();

    constructor() {
        this.setupAudioListeners();
    }

    private setupAudioListeners(): void {
        this.audio.addEventListener('timeupdate', () => {
            this.position.next(this.audio.currentTime);
        });

        this.audio.addEventListener('durationchange', () => {
            this.duration.next(this.audio.duration);
        });

        this.audio.addEventListener('ended', () => {
            this.next();
        });

        this.audio.addEventListener('play', () => {
            this.playing.next(true);
        });

        this.audio.addEventListener('pause', () => {
            this.playing.next(false);
        });
    }

    playQueue(queue: LocalTrack[], index = 0): void {
        this.queue.next(queue);
        this.currentIndex.next(index);
        if (queue[index]) {
            this.currentTrack.next(queue[index]);
            this.audio.src = queue[index].audioUrl;
            this.audio.play().catch(() => {});
        }
    }

    play(): void {
        this.audio.play().catch(() => {});
    }

    pause(): void {
        this.audio.pause();
    }

    setPosition(seconds: number): void {
        this.audio.currentTime = seconds;
    }

    next(): void {
        const queue = this.queue.value;
        let index = this.currentIndex.value + 1;

        if (index >= queue.length) {
            index = 0;
        }

        if (queue.length > 0) {
            this.currentIndex.next(index);
            this.currentTrack.next(queue[index]);
            this.audio.src = queue[index].audioUrl;
            this.audio.play().catch(() => {});
        }
    }

    prev(): void {
        const queue = this.queue.value;
        let index = this.currentIndex.value - 1;

        if (index < 0) {
            index = queue.length - 1;
        }

        if (queue.length > 0) {
            this.currentIndex.next(index);
            this.currentTrack.next(queue[index]);
            this.audio.src = queue[index].audioUrl;
            this.audio.play().catch(() => {});
        }
    }

    stop(): void {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.playing.next(false);
    }
}
