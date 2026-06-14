import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SeparatorComponent } from '@common/components/separator/separator.component';
import { RouterOutlet } from '@angular/router';
import { ReleaseCreateService } from './release-create.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ReleaseProgressComponent } from './components/release-progress/release-progress.component';
import {
    FlowCard,
    ForArtistReleaseCreateFlowCardComponent,
} from './components/flow-card/flow-card.component';
import { ReleaseCreateFormService } from './release-create-form.service';
import { AsyncPipe, NgClass } from '@angular/common';
import { ForArtistReleaseCreateWhatNextCardComponent } from './components/what-next-card/what-next-card.component';

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
        ForArtistReleaseCreateFlowCardComponent,
        NgClass,
        ForArtistReleaseCreateWhatNextCardComponent,
        AsyncPipe,
    ],
    providers: [ReleaseCreateService, ReleaseCreateFormService],
})
export class ForArtistReleaseCreateComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    flow: FlowCard[] = [
        {
            title: 'RELEASE_CREATE.FLOW.FIRST.TITLE',
            subtitle: 'RELEASE_CREATE.FLOW.FIRST.SUBTITLE',
            stage: 0,
        },
        {
            title: 'RELEASE_CREATE.FLOW.SECOND.TITLE',
            subtitle: 'RELEASE_CREATE.FLOW.SECOND.SUBTITLE',
            stage: 1,
        },
        {
            title: 'RELEASE_CREATE.FLOW.THIRD.TITLE',
            subtitle: 'RELEASE_CREATE.FLOW.THIRD.SUBTITLE',
            stage: 2,
        },
    ];

    constructor(
        private readonly releaseCreateService: ReleaseCreateService,
        public readonly releaseCreateFormService: ReleaseCreateFormService,
    ) {}

    current: number = 0;
    total: number = 2;

    get progressMessage(): string {
        switch (this.current) {
            case 0:
                return 'RELEASE_CREATE.RELEASE_PROGRESS.STEP_1.TITLE';
            case 1:
                return 'RELEASE_CREATE.RELEASE_PROGRESS.STEP_2.TITLE';
            case 2:
                return 'RELEASE_CREATE.RELEASE_PROGRESS.STEP_3.TITLE';
            default:
                return '';
        }
    }

    getRouteFormValid(): Observable<boolean> {
        return this.releaseCreateService.formValid$;
    }

    ngOnInit(): void {
        this.releaseCreateService.createState$
            .pipe(takeUntil(this.destroy$))
            .subscribe((state: number) => {
                this.current = state;
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    increaseStage(): void {
        if (this.current >= this.total) {
            return;
        }

        this.releaseCreateService.increaseStage();
    }

    decreaseStage(): void {
        if (this.current <= 0) {
            return;
        }

        this.releaseCreateService.decreaseStage();
    }

    submitForm(): void {
        if (this.current < this.total) {
            return;
        }

        if (!this.releaseCreateFormService.allFormsValid) {
            return;
        }

        this.releaseCreateService.submitRelease();
    }
}
