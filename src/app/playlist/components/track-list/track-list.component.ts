import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ListEntitiesFacade } from '../../../common/facades/list-entities.facade';
import { Track } from '../../../track/models/track';
import { TrackListService } from '../../services/track-list.service';
import { MatTableModule } from '@angular/material/table';
import { Observable, Subject } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { DurationTranslatePipe } from '../../../common/pipes/duration-translation.pipe';
import { MediaPlayerStateService } from '../../../common/services/media-player-state.service';

@Component({
    selector: 'app-track-list',
    standalone: true,
    templateUrl: './track-list.component.html',
    styleUrl: './track-list.component.scss',
    imports: [MatTableModule, TranslatePipe, MatIcon, AsyncPipe, DurationTranslatePipe],
    providers: [TrackListService],
})
export class TrackListComponent extends ListEntitiesFacade<Track> implements OnDestroy, OnInit {
    private readonly _unsubscribeAll = new Subject<void>();
    @Input() tracks: Track[] | undefined = [];

    isPlaying$: Observable<boolean>;
    displayedColumns: string[] = ['Number', 'Name', 'Album', 'Duration'];

    constructor(
        private readonly trackListService: TrackListService,
        private readonly mediaPlayerStateService: MediaPlayerStateService
    ) {
        super(trackListService);
        this.isPlaying$ = this.mediaPlayerStateService.playing$;
    }

    ngOnInit(): void {
        this.trackListService.tracks = this.tracks || [];
        this.trackListService.getPlaylistTracks();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();

        this.subscriptions.forEach((elem) => {
            if (elem) {
                elem.unsubscribe();
            }
        });
    }

    togglePlayButton(index: Track): void {
        
        const trackIndex = this.tracks?.indexOf(index) || 0;
        this.mediaPlayerStateService.playQueue(this.tracks || [], trackIndex);
    }
}
