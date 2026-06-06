import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SeparatorComponent } from '@common/components/separator/separator.component';
import { RouterOutlet } from '@angular/router';
import { ReleaseCreateService } from './release-create.service';
import { Subject, takeUntil } from 'rxjs';
import { ReleaseProgressComponent } from './components/release-progress/release-progress.component';
import { FlowCard, ForArtistReleaseCreateFlowCardComponent } from './components/flow-card/flow-card.component';

@Component({
    selector: 'for-artist-release-create',
    standalone: true,
    templateUrl: './release-create.component.html',
    styleUrl: './release-create.component.scss',
    imports: [
        TranslatePipe,
        SeparatorComponent,
        RouterOutlet,
        ReleaseProgressComponent,
        ForArtistReleaseCreateFlowCardComponent
    ],
    providers: [ReleaseCreateService],
})
export class ForArtistReleaseCreateComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    flow: FlowCard[] = [
        { title: 'RELEASE_CREATE.FLOW.FIRST', stage: 0 },
        { title: 'RELEASE_CREATE.FLOW.SECOND', stage: 1 },
        { title: 'RELEASE_CREATE.FLOW.THIRD', stage: 2 },
    ];

    constructor(private readonly releaseCreateService: ReleaseCreateService) {}

    current: number = 0;
    total: number = 3;

    get progressMessage(): string {
        switch (this.current) {
            case 0:
                return 'RELEASE_CREATE.RELEASE_PROGRESS.STEP_1';
            case 1:
                return 'RELEASE_CREATE.RELEASE_PROGRESS.STEP_2';
            case 2:
                return 'RELEASE_CREATE.RELEASE_PROGRESS.STEP_3';
            default:
                return '';
        }
    }

    ngOnInit(): void {
        this.releaseCreateService.createState$.pipe(takeUntil(this.destroy$)).subscribe((state) => {
            this.current = state;
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    increaseStage(): void {
        this.releaseCreateService.increaseStage();
    }

    decreaseStage(): void {
        this.releaseCreateService.decreaseStage();
    }
}
