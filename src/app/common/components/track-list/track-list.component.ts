import { Component, ElementRef, HostListener, Input, OnDestroy } from '@angular/core';
import { ListEntitiesFacade } from '@common/facades/list-entities.facade';
import { TrackListService } from './services/track-list.service';
import { MatTableModule } from '@angular/material/table';
import { Observable, Subject } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe, NgClass } from '@angular/common';
import { DurationTranslatePipe } from '@common/pipes/duration-translation.pipe';
import { MediaPlayerStateService } from '@common/services/media-player-state.service';
import { NavigationService } from '@common/services/navigation.service';
import { Track } from '@features/track/models/track';

@Component({
    selector: 'app-track-list',
    standalone: true,
    templateUrl: './track-list.component.html',
    styleUrl: './track-list.component.scss',
    imports: [MatTableModule, TranslatePipe, MatIcon, AsyncPipe, DurationTranslatePipe, NgClass],
    providers: [TrackListService],
})
export class TrackListComponent extends ListEntitiesFacade<Track> implements OnDestroy {
    private readonly _unsubscribeAll = new Subject<void>();
    @Input() tracks: Track[] | undefined | null = [];
    @Input() title: string | undefined | null = '';
    @Input() allowHeader: boolean = true;
    @Input() showArtist: boolean = true;
    
    isPlaying$: Observable<boolean>;
    currentTrack$: Observable<Track | null | undefined>;
    @Input() displayedColumns: string[] = ['Number', 'Name', 'Album', 'Duration'];

    constructor(
        private readonly trackListService: TrackListService,
        private readonly mediaPlayerStateService: MediaPlayerStateService,
        private readonly elRef: ElementRef,
        private readonly navigationService: NavigationService,
    ) {
        super(trackListService);
        this.isPlaying$ = this.mediaPlayerStateService.playingObs$;
        this.currentTrack$ = this.mediaPlayerStateService.currentTrackObs$;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (!this.elRef.nativeElement.contains(event.target)) {
            this.onSelect(undefined);
        }
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

    onSelect(track: Track | null | undefined): void {
        this.trackListService.onEntitySelectedId = track?.id;
    }

    togglePlayButton(track: Track) {
        if (!this.tracks || this.tracks.length === 0) return;

        if (
            this.mediaPlayerStateService.currentTrack?.id === track.id &&
            this.mediaPlayerStateService.currentTrack?.fromPlaylist === track.fromPlaylist
        ) {
            this.mediaPlayerStateService.playing
                ? this.mediaPlayerStateService.pause()
                : this.mediaPlayerStateService.play();
            return;
        }

        const tracks = this.tracks;
        const index = tracks.findIndex((t: Track) => t.id === track.id);

        this.mediaPlayerStateService.playQueue(tracks, index);
    }

    navigateAlbum(albumId: string) {
        this.navigationService.navigateAlbumById(albumId);
    }

    navigateArtist(artistId: string) {
        this.navigationService.navigateArtistById(artistId);
    }
}
