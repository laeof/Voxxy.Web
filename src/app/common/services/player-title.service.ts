import { Injectable, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MediaPlayerStateService } from './media-player-state.service';

@Injectable({
    providedIn: 'root',
})
export class PlayerTitleService implements OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly appTitle = 'Voxxy';

    constructor(
        private readonly title: Title,
        private readonly playerState: MediaPlayerStateService
    ) {
        this.init();
    }

    private init() {
        this.playerState.currentTrack$.pipe(takeUntil(this.destroy$)).subscribe((track) => {
            if (!track) {
                this.title.setTitle(this.appTitle);
                return;
            }

            const artist = track.artist?.name ?? '';
            const title = track.name ?? 'Voxxy';

            this.title.setTitle(`${title} - ${artist}`);
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
