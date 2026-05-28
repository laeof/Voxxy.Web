import { Component, Input } from '@angular/core';
import { Artist } from '../../models/artist';
import { ManagerComponent } from '@common/components/manager/manager.component';
import { ManagerSubjectNameComponent } from '@common/components/manager/manager-subject-info/subject-name/subject-name.component';
import { PlayButtonComponent } from '@common/components/action-buttons/play-button/play-button.component';
import { ArtistManagerCommonApprovedComponent } from '../artist-manager-common/artist-manager-common-approved/artist-approved.component';
import { ArtistManagerCommonListenersComponent } from '../artist-manager-common/artist-manager-common-listeners/artist-listeners.component';
import { FollowButtonComponent } from '@common/components/action-buttons/follow-button/follow-button.component';
import { ShuffleButtonComponent } from '@common/components/action-buttons/shuffle-button/shuffle-button.component';
import { AsyncPipe } from '@angular/common';
import { Album } from '@features/album/models/album';
import { ArtistPopularTrackService } from '@features/artist/services/artist-popular-track.service';
import { SingleEntityFacade } from '@common/facades/single-entity.facade';

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
        AsyncPipe,
    ],
})
export class ArtistManagerComponent extends SingleEntityFacade<Album> {
    @Input() artist: Artist | null = null;

    constructor(private readonly artistPopularTrackService: ArtistPopularTrackService) {
        super(artistPopularTrackService);
    }
}
