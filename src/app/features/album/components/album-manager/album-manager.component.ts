import { Component, Input } from '@angular/core';
import { Album } from '../../models/album';
import { ManagerComponent } from '@common/components/manager/manager.component';
import { PlayButtonComponent } from '@common/components/action-buttons/play-button/play-button.component';
import { ShuffleButtonComponent } from '@common/components/action-buttons/shuffle-button/shuffle-button.component';
import { ManagerSubjectTypeComponent } from '@common/components/manager/manager-subject-info/subject-type/subject-type.component';
import { ManagerSubjectNameComponent } from '@common/components/manager/manager-subject-info/subject-name/subject-name.component';
import { AlbumManagerCommonComponent } from '../album-manager-common/album-manager-common.component';

@Component({
    selector: 'album-manager',
    standalone: true,
    templateUrl: './album-manager.component.html',
    imports: [
        ManagerComponent,
        PlayButtonComponent,
        ShuffleButtonComponent,
        ManagerSubjectTypeComponent,
        ManagerSubjectNameComponent,
        AlbumManagerCommonComponent,
    ],
})
export class AlbumManagerComponent {
    @Input() album: Album | null | undefined = null;
}
