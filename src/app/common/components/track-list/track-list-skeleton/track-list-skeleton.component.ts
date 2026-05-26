import { Component } from '@angular/core';

@Component({
    selector: 'app-track-list-skeleton',
    standalone: true,
    templateUrl: './track-list-skeleton.component.html',
    styleUrls: ['./track-list-skeleton.component.scss', '../track-list.component.scss'],
    imports: [],
})
export class TrackListSkeletonComponent {
    rows = Array.from({ length: 4 });
}
