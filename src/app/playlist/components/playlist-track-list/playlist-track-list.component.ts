import { Component, effect, input } from '@angular/core';
import { PlaylistTrackListService } from '../../services/playlist-track-list.service';
import { TrackListComponent } from '../../../track-list/track-list.component';
import { ListEntitiesFacade } from '../../../common/facades/list-entities.facade';
import { Track } from '../../../track/models/track';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'playlist-track-list',
    standalone: true,
    template: ` <app-track-list [tracks]="dataSource$ | async" /> `,
    imports: [TrackListComponent, AsyncPipe],
    providers: [PlaylistTrackListService],
})
export class PlaylistTrackListComponent extends ListEntitiesFacade<Track> {
    playlistId = input.required<string>();

    constructor(private readonly playlistTrackListService: PlaylistTrackListService) {
        super(playlistTrackListService);

        effect(() => {
            this.playlistTrackListService.getPlaylistTracks(this.playlistId());
        });
    }
}
