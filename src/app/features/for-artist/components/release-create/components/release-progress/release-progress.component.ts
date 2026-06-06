import { Component, Input } from '@angular/core';
import { StateProgressComponent } from '@common/components/state-progress/state-progress.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'for-artist-release-create-progress',
    templateUrl: './release-progress.component.html',
    styleUrls: ['./release-progress.component.scss'],
    imports: [StateProgressComponent, TranslatePipe],
})
export class ReleaseProgressComponent {
    @Input() current: number = 0;
    @Input() total: number = 3;
    @Input() message: string = '';
}
