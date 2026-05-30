import { Component, Input } from '@angular/core';
import { Playlist } from '../../models/playlist';
import { ManagerComponent } from '@common/components/manager/manager.component';
import { ShuffleButtonComponent } from '@common/components/action-buttons/shuffle-button/shuffle-button.component';
import { PlayButtonComponent } from '@common/components/action-buttons/play-button/play-button.component';
import { ManagerSubjectNameComponent } from '@common/components/manager/manager-subject-info/subject-name/subject-name.component';
import { ManagerSubjectTypeComponent } from '@common/components/manager/manager-subject-info/subject-type/subject-type.component';
import { PlaylistManagerCommonComponent } from '../playlist-manager-common/playlist-manager-common.component';
import { FollowButtonComponent } from '@common/components/action-buttons/follow-button/follow-button.component';

@Component({
    selector: 'playlist-manager',
    standalone: true,
    templateUrl: './playlist-manager.component.html',
    imports: [
        ManagerComponent,
        ManagerSubjectNameComponent,
        ManagerSubjectTypeComponent,
        PlayButtonComponent,
        ShuffleButtonComponent,
        PlaylistManagerCommonComponent,
        FollowButtonComponent
    ],
})
export class PlaylistManagerComponent {
    @Input() playlist: Playlist | undefined | null;
}
