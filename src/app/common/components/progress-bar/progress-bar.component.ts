import { ChangeDetectionStrategy, Component } from '@angular/core';
import { distinctUntilChanged, Observable } from 'rxjs';
import { LoaderService } from '../../services/loader.service';
import { MatProgressBar } from '@angular/material/progress-bar';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-progress-bar',
    templateUrl: './progress-bar.component.html',
    styleUrls: ['./progress-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatProgressBar, AsyncPipe],
})
export class ProgressBarComponent {
    readonly visible$: Observable<boolean>;

    constructor(public loader: LoaderService) {
        this.visible$ = this.loader.loading$.pipe(distinctUntilChanged());
    }
}
