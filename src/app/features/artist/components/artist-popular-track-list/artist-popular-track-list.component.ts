import { AsyncPipe } from '@angular/common';
import { Component, effect, Input } from '@angular/core';
import { TrackListComponent } from '@common/components/track-list/track-list.component';
import { SingleEntityFacade } from '@common/facades/single-entity.facade';
import { Album } from '@features/album/models/album';
import { Artist } from '@features/artist/models/artist';
import { ArtistPopularTrackService } from '@features/artist/services/artist-popular-track.service';

@Component({
    selector: 'artist-popular-track-list',
    standalone: true,
    template: `
        <app-track-list
            [tracks]="(this.entity$ | async)?.tracks"
            [allowHeader]="false"
            [displayedColumns]="['Number', 'Name', 'Duration']"
            [showArtist]="false"
        />
    `,
    imports: [TrackListComponent, AsyncPipe],
})
export class ArtistPopularTrackListComponent extends SingleEntityFacade<Album> {
    @Input() artist: Artist | undefined = undefined;

    constructor(private readonly artistPopularTrackService: ArtistPopularTrackService) {
        super(artistPopularTrackService);

        effect(() => {
            this.artistPopularTrackService.getPopularTracks(this.artist?.id || '');
        });
    }
}
