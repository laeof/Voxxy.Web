import { Component, Input } from '@angular/core';
import { TrackListComponent } from '@common/components/track-list/track-list.component';
import { Track } from '@features/track/models/track';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'artist-popular-track-list',
    standalone: true,
    template: `
        <app-track-list
            [tracks]="dataSource"
            [title]="'TRACK_LIST.POPULAR_TRACKS' | translate"
            [allowHeader]="false"
            [displayedColumns]="['Number', 'Name', 'Duration']"
            [showArtist]="false"
        />
    `,
    imports: [TrackListComponent, TranslatePipe],
})
export class ArtistPopularTrackListComponent {
    @Input() dataSource: Track[] = [];
}
