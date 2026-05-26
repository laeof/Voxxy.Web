import { Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'playlist-manager-common',
    templateUrl: './playlist-manager-common.component.html',
    styleUrl: './playlist-manager-common.component.scss',
    imports: [TranslatePipe],
})
export class PlaylistManagerCommonComponent {
    @Input() authorImageUrl: string | undefined = undefined;
    @Input() authorName: string | undefined = undefined;
    @Input() authorId: string | undefined = undefined;
    @Input() tracksAmount: number | undefined = undefined;

    redirectToAuthor(authorId: string | undefined): void {
        if (!authorId) return;
    }
}
