import { Component, Input, OnInit } from '@angular/core';
import { Artist } from '../../models/artist';
import { ManagerComponent } from '@common/components/manager/manager.component';
import { ManagerSubjectNameComponent } from '@common/components/manager/manager-subject-info/subject-name/subject-name.component';
import { PlayButtonComponent } from '@common/components/action-buttons/play-button/play-button.component';
import { ArtistManagerCommonApprovedComponent } from '../artist-manager-common/artist-manager-common-approved/artist-approved.component';
import { ArtistManagerCommonListenersComponent } from '../artist-manager-common/artist-manager-common-listeners/artist-listeners.component';
import { FollowButtonComponent } from '@common/components/action-buttons/follow-button/follow-button.component';
import { ShuffleButtonComponent } from '@common/components/action-buttons/shuffle-button/shuffle-button.component';
import { ArtistPopularTrackListComponent } from '../artist-popular-track-list/artist-popular-track-list.component';
import { Track } from '@features/track/models/track';
import { Album } from '@features/album/models/album';

@Component({
    selector: 'app-artist-manager',
    standalone: true,
    templateUrl: './artist-manager.component.html',
    imports: [
        ManagerComponent,
        ManagerSubjectNameComponent,
        PlayButtonComponent,
        ArtistManagerCommonApprovedComponent,
        ArtistManagerCommonListenersComponent,
        FollowButtonComponent,
        ShuffleButtonComponent,
        ArtistPopularTrackListComponent,
    ],
})
export class ArtistManagerComponent implements OnInit {
    ngOnInit(): void {
        //fixme temporary solution, need to be fixed after backend changes
        this.dataSource = this.artist?.albums
            ?.filter((album) => album.tracks.length !== 0)
            ?.flatMap((album: Album) => {
                this.playlistId = album.id;
                album.tracks.forEach((track) => {
                    track.fromPlaylist = album.id;
                    track.artist = this.artist!;
                });
                return album.tracks;
            })!;
    }
    @Input() artist: Artist | null = null;
    dataSource: Track[] = [];
    playlistId: string | undefined = undefined;
}
