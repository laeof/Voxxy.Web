import { Component, effect, input } from '@angular/core';
import { PlaylistTrackListService } from '../../services/playlist-track-list.service';
import { Track } from '../../../track/models/track';
import { AsyncPipe } from '@angular/common';
import { TrackListComponent } from '@common/components/track-list/track-list.component';
import { ListEntitiesFacade } from '@common/facades/list-entities.facade';

@Component({
    selector: 'playlist-track-list',
    standalone: true,
    template: `
        <app-track-list
            [tracks]="dataSource$ | async"
            [sourceId]="playlistId()"
            sourceType="Playlist"
        />
    `,
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
