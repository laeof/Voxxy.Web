import { AsyncPipe, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ToggleBarService } from '@common/layout/services/togglebar.service';
import { MediaPlayerStateService } from '@common/services/media-player-state.service';
import { Track } from '@features/track/models/track';
import { Observable, Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'nowplayingbar-manager',
    templateUrl: './nowplayingbar-manager.component.html',
    styleUrl: './nowplayingbar-manager.component.scss',
    imports: [MatIcon, NgClass, AsyncPipe],
})
export class NowPlayingBarManagerComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    public nowPlayingBarExpanded: boolean = false;
    public readonly currentTrack$: Observable<Track | null>;

    constructor(
        private readonly toggleBarService: ToggleBarService,
        private readonly mediaPlayerStateService: MediaPlayerStateService,
    ) {
        this.currentTrack$ = this.mediaPlayerStateService.currentTrackObs$;
    }

    toggleNowPlayingBar(): void {
        this.toggleBarService.toggleNowPlayingBar();
    }

    ngOnInit(): void {
        this.toggleBarService.nowPlayingBarExpanded$
            .pipe(takeUntil(this.destroy$))
            .subscribe((expanded: boolean) => {
                this.nowPlayingBarExpanded = expanded;
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
