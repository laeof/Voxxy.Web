import { Component, Input } from '@angular/core';
import { PlaylistTypeTranslatePipe } from '@common/pipes/playlist-type-translation.pipe';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'manager-subject-type',
    templateUrl: './subject-type.component.html',
    styleUrl: './subject-type.component.scss',
    imports: [PlaylistTypeTranslatePipe, TranslatePipe],
})
export class ManagerSubjectTypeComponent {
    @Input() playlistType: number | undefined = undefined;
}
