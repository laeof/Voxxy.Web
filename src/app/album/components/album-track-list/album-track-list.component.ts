import { Component, effect, input } from '@angular/core';
import { TrackListComponent } from '../../../track-list/track-list.component';
import { ListEntitiesFacade } from '../../../common/facades/list-entities.facade';
import { Track } from '../../../track/models/track';
import { AsyncPipe } from '@angular/common';
import { AlbumTrackListService } from '../../services/album-track-list.service';

@Component({
    selector: 'album-track-list',
    standalone: true,
    template: ` <app-track-list [tracks]="dataSource$ | async" /> `,
    imports: [TrackListComponent, AsyncPipe],
    providers: [AlbumTrackListService],
})
export class AlbumTrackListComponent extends ListEntitiesFacade<Track> {
    albumId = input.required<string>();

    constructor(private readonly albumTrackListService: AlbumTrackListService) {
        super(albumTrackListService);

        effect(() => {
            this.albumTrackListService.getAlbumTracks(this.albumId());
        });
    }
}
